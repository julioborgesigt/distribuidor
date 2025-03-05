
    let allProcesses = [];
    let filteredProcesses = [];

    

    function fetchProcesses() {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log("fetchProcesses: Token não encontrado, redirecionando para login.");
        window.location.href = '/';
        return;
      }
      console.log("fetchProcesses: Iniciando fetch para '/processos' com token:", token);
      fetch('/processos', { 
        headers: { 'Authorization': 'Bearer ' + token }
        
      })
        .then(res => {
          console.log("fetchProcesses: Resposta recebida com status:", res.status);
          return res.json();
        })
        .then(data => {
          console.log("fetchProcesses: Dados recebidos:", data);
          allProcesses = data;
          updateFilters();
          filterAndRenderTable();
          console.log("fetchProcesses: Finalizado com sucesso.");
        })
        .catch(err => console.error("fetchProcesses: Erro durante fetch:", err));
    }
    
    
    

    function updateFilters() {
     
      const filtroAssunto = document.getElementById('filtroAssunto');
      const filtroTarjas = document.getElementById('filtroTarjas');

     
      filtroAssunto.innerHTML = '<option value="">Todos</option>';
      filtroTarjas.innerHTML = '<option value="">Todos</option>';

      const classes = new Set();
      const assuntos = new Set();
      const tarjasSet = new Set();

      allProcesses.forEach(proc => {
        if (proc.classe_principal) classes.add(proc.classe_principal);
        if (proc.assunto_principal) assuntos.add(proc.assunto_principal);
        if (proc.tarjas) tarjasSet.add(proc.tarjas);
      });

    
      assuntos.forEach(item => {
        const option = document.createElement('option');
        option.value = item;
        option.textContent = item;
        filtroAssunto.appendChild(option);
      });
      tarjasSet.forEach(item => {
        const option = document.createElement('option');
        option.value = item;
        option.textContent = item;
        filtroTarjas.appendChild(option);
      });
    }

    function filterAndRenderTable() {
     
      const filtroAssunto = document.getElementById('filtroAssunto').value;
      const filtroTarjas = document.getElementById('filtroTarjas').value;
      const filtroCumprido = document.getElementById('filtroCumprido').value;
      const ordenarPrazo = document.getElementById('ordenarPrazo').value;
      const ordenarData = document.getElementById('ordenarData').value;
      const ordenarDias = document.getElementById('ordenarDias').value;

      filteredProcesses = allProcesses.filter(proc => {
        let match = true;
     
        if (filtroAssunto && proc.assunto_principal !== filtroAssunto) match = false;
        if (filtroTarjas && proc.tarjas !== filtroTarjas) match = false;
        if (filtroCumprido === 'sim' && proc.cumprido !== true) match = false;
        if (filtroCumprido === 'nao' && proc.cumprido !== false) match = false;
        return match;
      });

      // Ordena por Prazo Processual
      if (ordenarPrazo) {
        filteredProcesses.sort((a, b) => {
          const aPrazo = parseInt(a.prazo_processual) || 0;
          const bPrazo = parseInt(b.prazo_processual) || 0;
          return ordenarPrazo === 'asc' ? aPrazo - bPrazo : bPrazo - aPrazo;
        });
      }

      // Ordena por Data da Intimação
      if (ordenarData) {
        filteredProcesses.sort((a, b) => {
          const aDate = new Date(a.data_intimacao);
          const bDate = new Date(b.data_intimacao);
          return ordenarData === 'asc' ? aDate - bDate : bDate - aDate;
        });
      }

      // Ordena por Dias Restantes
      if (ordenarDias) {
        filteredProcesses.sort((a, b) => {
          const calcDias = proc => {
            if (!proc.data_intimacao) return 0;
            const dataIntimacao = new Date(proc.data_intimacao);
            const prazoMatch = proc.prazo_processual ? proc.prazo_processual.match(/(\d+)/) : null;
            const prazoDias = prazoMatch ? parseInt(prazoMatch[1]) : 0;
            const prazoDate = new Date(dataIntimacao);
            prazoDate.setDate(prazoDate.getDate() + prazoDias);
            const diff = prazoDate - new Date();
            return Math.ceil(diff / (1000 * 60 * 60 * 24));
          };

          const aDias = calcDias(a);
          const bDias = calcDias(b);
          return ordenarDias === 'asc' ? aDias - bDias : bDias - aDias;
        });
      }

      renderTable(filteredProcesses);
    }

    function renderTable(data) {
      const tbody = document.querySelector('#processTable tbody');
      tbody.innerHTML = '';
      data.forEach(proc => {
        const prazoMatch = proc.prazo_processual ? proc.prazo_processual.match(/(\d+)/) : null;
        const prazoDias = prazoMatch ? parseInt(prazoMatch[1]) : 0;
        let diasRestantes = 'N/A';
        if (proc.data_intimacao) {
          const dataIntimacao = new Date(proc.data_intimacao);
          const prazoDate = new Date(dataIntimacao);
          prazoDate.setDate(prazoDate.getDate() + prazoDias);
          const diff = prazoDate - new Date();
          diasRestantes = Math.ceil(diff / (1000 * 60 * 60 * 24));
        }
        const reiteracoes = proc.reiteracoes || 0;
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${proc.numero_processo}</td>
          <td>${proc.prazo_processual || ''}</td>
          <td>${proc.classe_principal || ''}</td>
          <td>${proc.assunto_principal || ''}</td>
          <td>${proc.tarjas || ''}</td>
          <td>${proc.data_intimacao || ''}</td>
          <td>${diasRestantes}</td>
          <td>${reiteracoes}</td>
          <td class="observacoes-cell" data-process-id="${proc.id}">${proc.observacoes || ''}</td>
          <td>
            <input type="checkbox" class="cumprido-checkbox" data-id="${proc.id}" ${proc.cumprido ? 'checked' : ''}>
          </td>
        `;
        tbody.appendChild(tr);
      });

      // Listener para atualizar status de "Cumprido?" e, se marcado, zerar o contador de reiteracoes
      document.querySelectorAll('.cumprido-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
          const processId = e.target.getAttribute('data-id');
          const cumprido = e.target.checked;
          // Se marcado como cumprido, envia resetReiteracoes como true para zerar o contador
          const payload = { processId, cumprido };
          if (cumprido) {
            payload.resetReiteracoes = true;
          }
          fetch('/cumprir', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + localStorage.getItem('token')
            },
            body: JSON.stringify(payload)
          })
          .then(res => res.json())
          .then(data => {
            console.log(data);
            fetchProcesses(); // Atualiza a tabela
          })
          .catch(err => console.error(err));
        });
      });
    }



  document.addEventListener('DOMContentLoaded', () => {
    // Delegação de eventos para editar as células de observações
    document.querySelector('#processTable tbody').addEventListener('dblclick', function(e) {
      // Procura o elemento clicado (ou seu ancestral) que possua a classe "observacoes-cell"
      const cell = e.target.closest('.observacoes-cell');
      if (!cell) return; // Se não for célula de observações, sai

      // Evita que se adicione outro input se já houver um
      if (cell.querySelector('input')) return;

      const originalText = cell.innerText;
      const processId = cell.getAttribute('data-process-id');

      // Cria um input de texto limitado a 50 caracteres
      const input = document.createElement('input');
      input.type = 'text';
      input.value = originalText;
      input.maxLength = 20;
      input.style.width = '100%'; // Ocupa toda a largura da célula

      // Substitui o conteúdo da célula pelo input e foca nele
      cell.innerText = '';
      cell.appendChild(input);
      input.focus();

      // Quando o input perder o foco, tenta salvar o novo valor
      input.addEventListener('blur', () => {
        const newText = input.value;
        // Se desejar, aqui você pode adicionar validação (por exemplo, não permitir string vazia)
        cell.innerText = newText;
        const token = localStorage.getItem('token');
        fetch('/update-observacoes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
          },
          body: JSON.stringify({ processId, observacoes: newText })
        })
        .then(res => res.text())
        .then(msg => console.log('Observações atualizadas:', msg))
        .catch(err => {
          console.error('Erro ao atualizar observações:', err);
          // Em caso de erro, reverte para o valor original
          cell.innerText = originalText;
        });
      });
    });

  });


    // Código dark mode aqui
 
// Função para alternar o modo escuro
function applyDarkMode(isDark) {
  if (isDark) {
    document.body.classList.add('dark-mode');
    document.getElementById('sunIcon').style.display = 'none';
    document.getElementById('moonIcon').style.display = 'inline';
  } else {
    document.body.classList.remove('dark-mode');
    document.getElementById('sunIcon').style.display = 'inline';
    document.getElementById('moonIcon').style.display = 'none';
  }
  localStorage.setItem('darkMode', isDark);
}





document.getElementById('darkModeToggle').addEventListener('click', function() {
  const isDark = !document.body.classList.contains('dark-mode');
  applyDarkMode(isDark);
});

// Ao carregar a página, define o modo com base na preferência do usuário
document.addEventListener('DOMContentLoaded', () => {
  const darkModeEnabled = localStorage.getItem('darkMode') === 'true';
  applyDarkMode(darkModeEnabled);
  // Outras funções (fetchProcesses, etc.) aqui...
});

document.addEventListener('DOMContentLoaded', () => {
  fetchProcesses();
  // Listeners para filtros e ordenação

  document.getElementById('filtroAssunto').addEventListener('change', filterAndRenderTable);
  document.getElementById('filtroTarjas').addEventListener('change', filterAndRenderTable);
  document.getElementById('filtroCumprido').addEventListener('change', filterAndRenderTable);
  document.getElementById('ordenarPrazo').addEventListener('change', filterAndRenderTable);
  document.getElementById('ordenarData').addEventListener('change', filterAndRenderTable);
  document.getElementById('ordenarDias').addEventListener('change', filterAndRenderTable);

  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  });
});