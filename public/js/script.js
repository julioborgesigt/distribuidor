    
    // Variáveis globais para armazenar processos
    let allProcesses = [];
    let filteredProcesses = [];
    let currentChartType = 'todos';
    
    async function fetchWithAuth(url, options = {}) {
      const response = await fetch(url, options);
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('userInfo');
        window.location.href = '/';
        // Opcional: interrompe a execução lançando um erro
        throw new Error('Token expirado ou acesso não autorizado.');
      }
      return response;
    }
    
    
    // Função para criar um progress ring usando ProgressBar.js
    function createChartCircle(label, percentage, count) {
    // Calcula o tamanho conforme a largura da tela
    const size =  window.innerWidth  < 768 ? 80 : 100;
    const strokeWidth = 8;
    var wrapper = document.createElement("div");
    wrapper.className = "chart-circle";
    wrapper.style.width = size + "px";
    wrapper.style.height = size + "px";
    wrapper.style.position = "relative";

    var progressContainer = document.createElement("div");
    progressContainer.style.width = "100%";
    progressContainer.style.height = "100%";
    wrapper.appendChild(progressContainer);

    setTimeout(function() {
      var circle = new ProgressBar.Circle(progressContainer, {
        color: '#007bff',
        strokeWidth: strokeWidth,
        trailWidth: strokeWidth,
        trailColor: '#eee',
        easing: 'easeInOut',
        duration: 1400,
        text: {
          autoStyleContainer: false
        },
        from: { color: '#aaa', width: strokeWidth },
        to: { color: '#007bff', width: strokeWidth },
        step: function(state, circleInstance) {
          circleInstance.setText("<strong>" + label + "</strong><br>" + count + "<br>(" + Math.round(circleInstance.value() * 100) + "%)");
        }
      });
      // Ajusta a fonte proporcional ao tamanho do círculo
      circle.text.style.fontFamily = '"Arial", sans-serif';
      circle.text.style.fontSize = (size / 8) + "px";
      circle.animate(percentage / 100);
    }, 10);

    return wrapper;
  }



    // Função para calcular dias restantes
    function calcDias(proc) {
      if (!proc.data_intimacao) return 0;
      const dataIntimacao = new Date(proc.data_intimacao);
      const prazoMatch = proc.prazo_processual ? proc.prazo_processual.match(/(\d+)/) : null;
      const prazoDias = prazoMatch ? parseInt(prazoMatch[1]) : 0;
      const prazoDate = new Date(dataIntimacao);
      prazoDate.setDate(prazoDate.getDate() + prazoDias);
      const diff = prazoDate - new Date();
      return Math.ceil(diff / (1000 * 60 * 60 * 24));
    }

    function updateCharts() {
      // Atualiza o layout do cabeçalho com base na largura da tela
      const header = document.querySelector('.chart-header');
      if (window.innerWidth < 768) {
        header.style.flexDirection = 'column';
        header.style.alignItems = 'center';
        const toggleContainer = header.querySelector('.chart-toggle-container');
        toggleContainer.style.alignSelf = 'flex-end';
        toggleContainer.style.marginTop = '-20px';
      } else {
        header.style.flexDirection = 'row';
        header.style.alignItems = 'center';
        const toggleContainer = header.querySelector('.chart-toggle-container');
        toggleContainer.style.alignSelf = '';
        toggleContainer.style.marginTop = '';
      }
    
      // Limpa o container dos gráficos
      const container = document.getElementById('statsRow');
      container.innerHTML = '';
    
      // Define os processos a serem considerados:
      // - Se o usuário escolheu "cumprido", filtra os processos cumpridos dos últimos 30 dias;
      // - Caso contrário, considera apenas os processos não cumpridos.
      let processesToCount = [];
      if (currentChartType === 'cumprido') {
        const now = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);
        processesToCount = allProcesses.filter(proc =>
          proc.cumprido &&
          proc.cumpridoDate &&
          new Date(proc.cumpridoDate) >= thirtyDaysAgo
        );
      } else {
        processesToCount = allProcesses.filter(proc => !proc.cumprido);
      }
    
      const total = processesToCount.length;
    
      // Em casos que NÃO sejam "cumprido", adiciona o círculo de "Pend." (pendentes)
      if (currentChartType !== 'cumprido' && total > 0) {
        const totalNaoCumpridos = processesToCount.filter(proc => proc.cumprido === false).length;
        container.appendChild(createChartCircle('Pend.', (totalNaoCumpridos / total) * 100, totalNaoCumpridos));
      }
    
      // Agrupa os processos por usuário (com os dados filtrados)
      const userCounts = {};
      processesToCount.forEach(proc => {
        if (proc.User && proc.User.nome) {
          const name = proc.User.nome;
          userCounts[name] = (userCounts[name] || 0) + 1;
        }
      });
      Object.entries(userCounts).forEach(([name, count]) => {
        const abbrev = name.substring(0, 8);
        const percentage = total > 0 ? (count / total) * 100 : 0;
        container.appendChild(createChartCircle(abbrev, percentage, count));
      });
    
      // Se o modo selecionado for "todos", adiciona também os gráficos das categorias
      if (currentChartType === 'todos') {
        let overdue = 0, urgent = 0, upcoming = 0, preso = 0, homicid = 0, furtos = 0, roubos = 0, estelionatos = 0, traficos = 0;
        processesToCount.forEach(proc => {
          const dias = proc.data_intimacao ? calcDias(proc) : 0;
          if (dias <= 0) {
            overdue++;
          } else if (dias < 10) {
            urgent++;
          } else if (dias < 30) {
            upcoming++;
          }
          if (proc.tarjas && proc.tarjas.trim().toLowerCase().includes('réu preso')) {
            preso++;
          }
          if (proc.assunto_principal &&
              ['homicídio qualificado', 'homicídio simples', 'homicídio culposo']
              .some(h => proc.assunto_principal.trim().toLowerCase().includes(h))) {
            homicid++;
          }
          if (proc.assunto_principal &&
              ['roubo', 'roubo qualificado']
              .some(h => proc.assunto_principal.trim().toLowerCase().includes(h))) {
            roubos++;
          }
          if (proc.assunto_principal &&
              ['furto', 'furto qualificado']
              .some(h => proc.assunto_principal.trim().toLowerCase().includes(h))) {
            furtos++;
          }
          if (proc.assunto_principal &&
            ['estelionato', 'estelionato majorado', 'estelionato contra o idoso']
            .some(h => proc.assunto_principal.trim().toLowerCase().includes(h))) {
          estelionatos++;
          }
          if (proc.assunto_principal &&
            ['tráfico de drogas e condutas afins']
            .some(h => proc.assunto_principal.trim().toLowerCase().includes(h))) {
          traficos++;
          
        }
        });
    
        container.appendChild(createChartCircle('Vencidos', (overdue / total) * 100, overdue));
        container.appendChild(createChartCircle('P < 10d', (urgent / total) * 100, urgent));
        container.appendChild(createChartCircle('P < 30d', (upcoming / total) * 100, upcoming));
        container.appendChild(createChartCircle('R.Preso', (preso / total) * 100, preso));
        container.appendChild(createChartCircle('Homic.', (homicid / total) * 100, homicid));
        container.appendChild(createChartCircle('Roubos', (roubos / total) * 100, roubos));
        container.appendChild(createChartCircle('Furtos', (furtos / total) * 100, furtos));
        container.appendChild(createChartCircle('Estelio.', (estelionatos / total) * 100, estelionatos));
        container.appendChild(createChartCircle('Tráfico', (traficos / total) * 100, traficos));
      }
    }
  
       

    

    document.addEventListener('DOMContentLoaded', () => {
      fetchProcesses();
      document.getElementById('filtroClasse').addEventListener('change', filterAndRenderTable);
      document.getElementById('filtroAssunto').addEventListener('change', filterAndRenderTable);
      document.getElementById('filtroTarjas').addEventListener('change', filterAndRenderTable);
      document.getElementById('filtroUsuario').addEventListener('change', filterAndRenderTable);
      document.getElementById('ordenarPrazo').addEventListener('change', filterAndRenderTable);
      document.getElementById('ordenarData').addEventListener('change', filterAndRenderTable);
      document.getElementById('ordenarDias').addEventListener('change', filterAndRenderTable);
      document.getElementById('ordenarIntim').addEventListener('change', filterAndRenderTable);
      document.getElementById('filtroCumprido').addEventListener('change', filterAndRenderTable);
      document.getElementById('select-all').addEventListener('change', (e) => {
        const checked = e.target.checked;
        document.querySelectorAll('.bulk-checkbox').forEach(cb => {
          cb.checked = checked;
        });
      });

      document.getElementById('buscaProcesso').addEventListener('input', function(e) {
        let digits = this.value.replace(/\D/g, '').substring(0,20);
        let formatted = '';
        if (digits.length > 0) {
          formatted = digits.substring(0,7);
        }
        if (digits.length > 7) {
          formatted += '-' + digits.substring(7,9);
        }
        if (digits.length > 9) {
          formatted += '.' + digits.substring(9,13);
        }
        if (digits.length > 13) {
          formatted += '.' + digits.substring(13,14);
        }
        if (digits.length > 14) {
          formatted += '.' + digits.substring(14,16);
        }
        if (digits.length > 16) {
          formatted += '.' + digits.substring(16,20);
        }
        this.value = formatted;
        
        const searchValue = formatted;
        if (searchValue) {
          const searchFiltered = allProcesses.filter(proc => proc.numero_processo.includes(searchValue));
          renderTable(searchFiltered);
          updateCharts();
        } else {
          filterAndRenderTable();
          updateCharts();
        }
      });

      const chartToggle = document.getElementById('chartToggle');
      chartToggle.addEventListener('change', function() {
        currentChartType = this.checked ? 'cumprido' : 'todos';
        updateCharts();
      });
        
    });

    function fetchProcesses() {
      const token = localStorage.getItem('token');
      fetchWithAuth('/admin/processes', { headers: { 'Authorization': 'Bearer ' + token } })
        .then(res => res.json())
        .then(data => {
          allProcesses = data;
          updateFilters();
          filterAndRenderTable();
          updateCharts();
        })
        .catch(err => console.error(err));
    }

    function updateFilters() {
      const filtroClasse = document.getElementById('filtroClasse');
      const filtroAssunto = document.getElementById('filtroAssunto');
      const filtroTarjas = document.getElementById('filtroTarjas');
      const filtroUsuario = document.getElementById('filtroUsuario');
    
      // Salva os valores atualmente selecionados
      const selectedClasse = filtroClasse ? filtroClasse.value : "";
      const selectedAssunto = filtroAssunto.value;
      const selectedTarjas = filtroTarjas.value;
      const selectedUsuario = filtroUsuario.value;
    
      // Reinicia os selects com a opção padrão
      if (filtroClasse) filtroClasse.innerHTML = '<option value="">Todos</option>';
      filtroAssunto.innerHTML = '<option value="">Todos</option>';
      filtroTarjas.innerHTML = '<option value="">Todos</option>';
      filtroUsuario.innerHTML = '<option value="">Todos</option><option value="nenhum">Nenhum</option>';
    
      // Cria conjuntos para as novas opções
      const classes = new Set();
      const assuntos = new Set();
      const tarjasSet = new Set();
      const usuarios = new Set();
    
      allProcesses.forEach(proc => {
        if (proc.classe_principal) classes.add(proc.classe_principal);
        if (proc.assunto_principal) assuntos.add(proc.assunto_principal);
        if (proc.tarjas) tarjasSet.add(proc.tarjas);
        if (proc.User && proc.User.nome) usuarios.add(proc.User.nome);
      });
    
      // Popula o select de Classe (se existir)
      if (filtroClasse) {
        classes.forEach(item => {
          const option = document.createElement('option');
          option.value = item;
          option.textContent = item;
          filtroClasse.appendChild(option);
        });
      }
      // Popula o select de Assunto
      assuntos.forEach(item => {
        const option = document.createElement('option');
        option.value = item;
        option.textContent = item;
        filtroAssunto.appendChild(option);
      });
      // Popula o select de Tarjas
      tarjasSet.forEach(item => {
        const option = document.createElement('option');
        option.value = item;
        option.textContent = item;
        filtroTarjas.appendChild(option);
      });
      // Popula o select de Usuário
      usuarios.forEach(item => {
        const option = document.createElement('option');
        option.value = item;
        option.textContent = item;
        filtroUsuario.appendChild(option);
      });
    
      // Restaura as seleções anteriores
      if (filtroClasse) filtroClasse.value = selectedClasse;
      filtroAssunto.value = selectedAssunto;
      filtroTarjas.value = selectedTarjas;
      filtroUsuario.value = selectedUsuario;
    }
    

    function filterAndRenderTable() {
      const filtroClasse = document.getElementById('filtroClasse').value;
      const filtroAssunto = document.getElementById('filtroAssunto').value;
      const filtroTarjas = document.getElementById('filtroTarjas').value;
      const filtroUsuario = document.getElementById('filtroUsuario').value;
      const filtroCumprido = document.getElementById('filtroCumprido').value; // novo filtro
      const ordenarPrazo = document.getElementById('ordenarPrazo').value;
      const ordenarData = document.getElementById('ordenarData').value;
      const ordenarDias = document.getElementById('ordenarDias').value;
      const ordenarIntim = document.getElementById('ordenarIntim') ? document.getElementById('ordenarIntim').value : '';
    
      filteredProcesses = allProcesses.filter(proc => {
        let match = true;
        if (filtroClasse && proc.classe_principal !== filtroClasse) match = false;
        if (filtroAssunto && proc.assunto_principal !== filtroAssunto) match = false;
        if (filtroTarjas && proc.tarjas !== filtroTarjas) match = false;
        if (filtroUsuario) {
          const userName = proc.User ? proc.User.nome : 'nenhum';
          if (userName !== filtroUsuario) match = false;
        }
        // Filtra por "Cumprido?"
        if (filtroCumprido === 'sim' && proc.cumprido !== true) match = false;
        if (filtroCumprido === 'nao' && proc.cumprido !== false) match = false;
    
        return match;
      });
    
      // Ordenação por Prazo Processual
      if (ordenarPrazo) {
        filteredProcesses.sort((a, b) => {
          const aPrazo = parseInt(a.prazo_processual) || 0;
          const bPrazo = parseInt(b.prazo_processual) || 0;
          return ordenarPrazo === 'asc' ? aPrazo - bPrazo : bPrazo - aPrazo;
        });
      }
    
      // Ordenação por Data da Intimação
      if (ordenarData) {
        filteredProcesses.sort((a, b) => {
          const aDate = new Date(a.data_intimacao);
          const bDate = new Date(b.data_intimacao);
          return ordenarData === 'asc' ? aDate - bDate : bDate - aDate;
        });
      }
    
      // Ordenação por Dias Restantes
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
    
      // Ordenação por Quantidade de Intimações (se existir o filtro)
      if (ordenarIntim) {
        filteredProcesses.sort((a, b) => {
          const aIntim = a.reiteracoes || 0;
          const bIntim = b.reiteracoes || 0;
          return ordenarIntim === 'asc' ? aIntim - bIntim : bIntim - aIntim;
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
        const userName = proc.User ? proc.User.nome : 'nenhum';
        const reiteracoes = proc.reiteracoes || 0;
        const statusCumprido = proc.cumprido ? 'sim' : 'não';
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><input type="checkbox" class="bulk-checkbox" data-id="${proc.id}"></td>
          <td>${proc.numero_processo}</td>
          <td class="hide-mobile">${proc.prazo_processual || ''}</td>
          <td class="hide-mobile">${proc.classe_principal || ''}</td>
          <td class="hide-mobile assunto">${proc.assunto_principal || ''}</td>
          <td class="tarjas">${proc.tarjas || ''}</td>
          <td class="hide-mobile dintim">${proc.data_intimacao || ''}</td>
          <td>${userName}</td>
          <td>${diasRestantes}</td>
          <td class="intim-cell" data-process-id="${proc.id}">${reiteracoes}</td>
          <td class="hide-mobile statuscumprido">${statusCumprido}</td>
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

    // Upload de CSV
    const csvUploadForm = document.getElementById('csvUploadForm');
    document.getElementById('csvUploadForm').addEventListener('submit', function(e) {
      e.preventDefault();
      document.getElementById('loading-overlay').style.display = 'flex';
      const formData = new FormData(this);
      fetch('/admin/upload', {
        method: 'POST',
        headers: { 
          'Authorization': 'Bearer ' + localStorage.getItem('token')
        },
        body: formData
      })
      .then(res => res.text())
      .then(msg => {
        document.getElementById('loading-overlay').style.display = 'none';
        alert(msg);
        fetchProcesses();
      })
      .catch(err => {
        document.getElementById('loading-overlay').style.display = 'none';
        console.error('Erro ao enviar o arquivo:', err);
      });
    });


// Pré-cadastro de usuário
const preCadastroForm = document.getElementById('preCadastroForm');
preCadastroForm.addEventListener('submit', e => {
  e.preventDefault();
  document.getElementById('loading-overlay').style.display = 'flex';
  // Coleta os dados do formulário
  const formData = new FormData(preCadastroForm);
  const data = {
    matricula: formData.get('matricula'),
    nome: formData.get('nome'),
    senha: formData.get('senha'),
    tipoCadastro: formData.get('tipoCadastro') // "admin_padrao" ou "admin_super"
  };

  console.log('Tipo de cadastro selecionado:', data.tipoCadastro);
  console.log('Dados enviados para pré-cadastro:', data);

  const token = localStorage.getItem('token');
  fetch('/admin/pre-cadastro', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json', 
      'Authorization': 'Bearer ' + token 
    },
    body: JSON.stringify(data)
  })
  .then(async res => {
    if (res.status === 409) {
      const responseData = await res.json();
      if (confirm(responseData.updatePrompt)) {
        // Se o usuário confirmar a atualização, reenvia com updateIfExists true
        data.updateIfExists = true;
        return fetch('/admin/pre-cadastro', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json', 
            'Authorization': 'Bearer ' + token 
          },
          body: JSON.stringify(data)
        }).then(res => res.text());
      } else {
        
        throw new Error('Usuário optou por não atualizar.');
      }
    } else {
      return res.text();
    }
  })
  .then(msg => {
    document.getElementById('loading-overlay').style.display = 'none';
    alert(msg);
    preCadastroForm.reset();
  })
  .catch(err => {
    document.getElementById('loading-overlay').style.display = 'none';
    console.error(err)});
});




    // Reset de senha
document.getElementById('resetPasswordBtn').addEventListener('click', () => {
  const matricula = document.getElementById('matriculaAction').value.trim();
  if (!matricula) {
    document.getElementById('loading-overlay').style.display = 'none';
    alert('Por favor, informe a matrícula.');
    return;
  }
  const data = { matricula };
  document.getElementById('loading-overlay').style.display = 'flex';
  fetch('/admin/reset-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + localStorage.getItem('token')
    },
    body: JSON.stringify(data)
  })
    .then(res => res.text())
    .then(msg => {
      document.getElementById('loading-overlay').style.display = 'none';
      alert(msg);
      document.getElementById('userActionForm').reset();
    })
    .catch(err => {
      document.getElementById('loading-overlay').style.display = 'none';
      console.error(err)
    });
});

// Deletar usuário
document.getElementById('deleteUserBtn').addEventListener('click', () => {
  const matricula = document.getElementById('matriculaAction').value.trim();
  document.getElementById('loading-overlay').style.display = 'flex';
  if (!matricula) {
    document.getElementById('loading-overlay').style.display = 'none';
    alert('Por favor, informe a matrícula.');
    return;
  }
  // Opcional: pedir confirmação
  
  if (!confirm(`Tem certeza que deseja apagar o usuário com matrícula ${matricula}?`)) return;
  
  const data = { matricula };
  fetch('/admin/delete-matricula', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + localStorage.getItem('token')
    },
    body: JSON.stringify(data)
  })
    .then(res => res.text())
    .then(msg => {
      document.getElementById('loading-overlay').style.display = 'none';
      alert(msg);
      document.getElementById('userActionForm').reset();
    })
    .catch(err => {
      document.getElementById('loading-overlay').style.display = 'none';
      console.error(err)
    });
});




    // Atribuição em massa
    document.getElementById('bulkAtribuirBtn').addEventListener('click', () => {
      const selectedIds = Array.from(document.querySelectorAll('.bulk-checkbox'))
        .filter(cb => cb.checked)
        .map(cb => cb.getAttribute('data-id'));
      const matriculaDestino = document.getElementById('bulkMatricula').value.trim();
      
      console.log('IDs selecionados para atribuição:', selectedIds);
      
      if (selectedIds.length === 0) {
        alert('Nenhum processo selecionado.');
        return;
      }
      if (!matriculaDestino) {
        alert('Digite a matrícula destino para a atribuição em massa.');
        return;
      }
      
      fetch('/admin/bulk-assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('token') },
        body: JSON.stringify({ processIds: selectedIds, matricula: matriculaDestino })
      })
      .then(res => res.text())
      .then(msg => {
        alert(msg);
        fetchProcesses();
      })
      .catch(err => console.error('Erro no bulk-assign:', err));
    });

    // Exclusão em massa
    document.getElementById('bulkExcluirBtn').addEventListener('click', () => {
      const selectedIds = Array.from(document.querySelectorAll('.bulk-checkbox'))
        .filter(cb => cb.checked)
        .map(cb => cb.getAttribute('data-id'));
      
      console.log('IDs selecionados para exclusão:', selectedIds);
      
      if (selectedIds.length === 0) {
        alert('Nenhum processo selecionado.');
        return;
      }
      
      fetch('/admin/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('token') },
        body: JSON.stringify({ processIds: selectedIds })
      })
      .then(res => res.text())
      .then(msg => {
        alert(msg);
        fetchProcesses();
      })
      .catch(err => console.error('Erro no bulk-delete:', err));
    });

    // Marcar como cumprido em massa
    document.getElementById('bulkCumpridoBtn').addEventListener('click', () => {
      const selectedIds = Array.from(document.querySelectorAll('.bulk-checkbox'))
        .filter(cb => cb.checked)
        .map(cb => cb.getAttribute('data-id'));
      
      console.log('IDs selecionados para marcar como cumprido:', selectedIds);
      
      if (selectedIds.length === 0) {
        alert('Nenhum processo selecionado.');
        return;
      }
      
      fetch('/admin/bulk-cumprido', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('token') },
        body: JSON.stringify({ processIds: selectedIds })
      })
      .then(res => res.text())
      .then(msg => {
        alert(msg);
        fetchProcesses();
      })
      .catch(err => console.error('Erro no bulk-cumprido:', err));
    });

   
  // Função para aplicar o modo (dark ou light)
  function applyDarkMode(isDark) {
    if (isDark) {
      document.body.classList.add('dark-mode');
      document.getElementById('sunIcon').style.display = 'none';
      document.getElementById('moonIcon').style.display = 'block';
    } else {
      document.body.classList.remove('dark-mode');
      document.getElementById('sunIcon').style.display = 'block';
      document.getElementById('moonIcon').style.display = 'none';
    }
    // Salva a preferência no localStorage
    localStorage.setItem('darkMode', isDark);
  }

  // Verifica a preferência ao carregar a página
  document.addEventListener('DOMContentLoaded', function() {
    const darkModeEnabled = localStorage.getItem('darkMode') === 'true';
    applyDarkMode(darkModeEnabled);
  });

  // Alterna o modo escuro ao clicar no botão
  document.getElementById('darkModeToggle').addEventListener('click', function() {
    const isDark = !document.body.classList.contains('dark-mode');
    applyDarkMode(isDark);
  });


  document.addEventListener('DOMContentLoaded', () => { 
    // Adiciona delegação de eventos no tbody para células com a classe 'intim-cell'
document.querySelector('#processTable tbody').addEventListener('dblclick', function(e) {
  // Procura o elemento clicado ou seu ancestral que possua a classe 'intim-cell'
  const cell = e.target.closest('.intim-cell');
  if (!cell) return; // Se não for uma célula de intim, ignora

  console.log('Duplo clique na célula de intim:', cell);
  
  // Se já houver um input na célula, não faz nada (evita duplicação)
  if (cell.querySelector('input')) return;

  const originalValue = cell.innerText;
  const processId = cell.getAttribute('data-process-id');

  // Cria um input para edição
  const input = document.createElement('input');
  input.type = 'number';
  input.value = originalValue;
  input.style.width = '60px';

  // Substitui o conteúdo da célula pelo input
  cell.innerText = '';
  cell.appendChild(input);
  input.focus();

  // Ao perder o foco, salva o novo valor
  input.addEventListener('blur', () => {
    const newValue = input.value;
    // Validação básica: se for inválido, reverte para o valor original
    if (newValue === '' || isNaN(newValue) || newValue < 0) {
      cell.innerText = originalValue;
      return;
    }
    cell.innerText = newValue;
    // Envia a atualização para o servidor
    const token = localStorage.getItem('token');
    fetch('/admin/update-intim', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({ processId, reiteracoes: newValue })
    })
    .then(res => res.text())
    .then(msg => console.log('Atualização:', msg))
    .catch(err => {
      console.error('Erro ao atualizar o número de intim:', err);
      cell.innerText = originalValue;
    });
  });
});

  });

 
  
  
  function printTableAutoTable(onlySelected) {
    // Extrai os cabeçalhos da tabela
    const table = document.getElementById('processTable');
    const headers = [];
    table.querySelectorAll('thead th').forEach(th => {
      // Ignora a coluna de checkbox
      if (!th.querySelector('input')) {
        headers.push(th.innerText.trim());
      }
    });
  
    // Extrai os dados das linhas
    const data = [];
    table.querySelectorAll('tbody tr').forEach(tr => {
      // Se onlySelected for true, verifica se o checkbox está marcado
      const checkbox = tr.querySelector('.bulk-checkbox');
      if (onlySelected && (!checkbox || !checkbox.checked)) return;
  
      const row = [];
      tr.querySelectorAll('td').forEach((td, index) => {
        if (index === 0) return; // ignora a coluna do checkbox
        row.push(td.innerText.trim());
      });
      data.push(row);
    });
  
    // Cria o PDF em formato A4, paisagem
    const pdf = new jspdf.jsPDF('landscape', 'mm', 'a4');
  
    // Configurações de margem
    const marginLeft = 10;
    const marginTop = 10;
    // Largura da página disponível (considerando as margens)
    const pageWidth = pdf.internal.pageSize.getWidth();
    const availableWidth = pageWidth - marginLeft * 2;
  
    // Obtém o texto dos filtros e gera uma string com os filtros em linha única
    const filterText = getSelectedFilters();
    pdf.setFontSize(10);
    // Quebra o texto automaticamente de acordo com a largura disponível
    const filterLines = pdf.splitTextToSize(filterText, availableWidth);
    // Adiciona os filtros no PDF
    pdf.text(filterLines, marginLeft, marginTop);
  
    // Define a posição de início da tabela logo abaixo dos filtros
    // Calcula o Y inicial com base no número de linhas geradas (assumindo 5mm de altura por linha)
    const startY = marginTop + (filterLines.length * 5) + 5;
  
    // Gera a tabela utilizando o AutoTable
    pdf.autoTable({
      startY: startY,
      head: [headers],
      body: data,
      styles: { fontSize: 8 }
    });
  
    // Salva o PDF
    pdf.save(onlySelected ? 'tabela_selecionada.pdf' : 'tabela_completa.pdf');
  }
  
  function printTableAutoTable(onlySelected) {
    const table = document.getElementById('processTable');
  
    // Extraindo os cabeçalhos e definindo quais índices serão excluídos
    const headerCells = Array.from(table.querySelectorAll('thead th'));
    const headers = [];
    const excludedIndexes = [];
    
    headerCells.forEach((th, index) => {
      const text = th.innerText.trim();
      // Ignora a coluna de checkbox ou a coluna "Atribuir Matricula."
      if (th.querySelector('input') || text === "Atribuir Matricula.") {
        excludedIndexes.push(index);
      } else {
        headers.push(text);
      }
    });
  
    // Extraindo os dados das linhas, ignorando as colunas excluídas
    const data = [];
    table.querySelectorAll('tbody tr').forEach(tr => {
      const rowCells = Array.from(tr.querySelectorAll('td'));
      
      // Se onlySelected for true, verifica se o checkbox (primeira coluna) está marcado
      const checkbox = rowCells[0].querySelector('.bulk-checkbox');
      if (onlySelected && (!checkbox || !checkbox.checked)) return;
      
      const rowData = [];
      rowCells.forEach((td, index) => {
        if (!excludedIndexes.includes(index)) {
          rowData.push(td.innerText.trim());
        }
      });
      data.push(rowData);
    });
  
    // Cria o PDF em formato A4, paisagem
    const pdf = new jspdf.jsPDF('landscape', 'mm', 'a4');
  
    // Configura as margens e largura disponível para o texto dos filtros
    const marginLeft = 10;
    const marginTop = 10;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const availableWidth = pageWidth - marginLeft * 2;
  
    // Obtém os filtros e os quebra automaticamente conforme a largura disponível
    const filterText = getSelectedFilters();
    pdf.setFontSize(10);
    const filterLines = pdf.splitTextToSize(filterText, availableWidth);
    pdf.text(filterLines, marginLeft, marginTop);
  
    // Calcula o startY para a tabela com base na quantidade de linhas dos filtros
    const startY = marginTop + (filterLines.length * 5) + 5;
  
    // Gera a tabela utilizando o AutoTable
    pdf.autoTable({
      startY: startY,
      head: [headers],
      body: data,
      styles: { fontSize: 8 }
    });
  
    pdf.save(onlySelected ? 'tabela_selecionada.pdf' : 'tabela_completa.pdf');
  }
  
  function getSelectedFilters() {
    const filters = {
      "Classe": document.getElementById('filtroClasse').value || 'Todos',
      "Assunto": document.getElementById('filtroAssunto').value || 'Todos',
      "Tarjas": document.getElementById('filtroTarjas').value || 'Todos',
      "Usuário": document.getElementById('filtroUsuario').value || 'Todos',
      "Prazo P.": document.getElementById('ordenarPrazo').value || 'Selecione',
      "Dt. Int.": document.getElementById('ordenarData').value || 'Selecione',
      "Dias Rest.": document.getElementById('ordenarDias').value || 'Selecione',
      "Nº Intim.": document.getElementById('ordenarIntim') ? document.getElementById('ordenarIntim').value : 'Selecione',
      "Cumprido": document.getElementById('filtroCumprido').value || 'Todos',
      "Busca por Nº P.": document.getElementById('buscaProcesso').value || ''
    };
  
    // Junta os filtros em uma única linha, separados por " | "
    const filtersArray = Object.entries(filters).map(
      ([key, value]) => `${key}: ${value}`
    );
    return "Filtros Selecionados: " + filtersArray.join(" | ");
  }

  
  // Eventos para os botões de impressão
  document.getElementById('printAllBtn').addEventListener('click', () => {
    printTableAutoTable(false);
  });
  
  document.getElementById('printSelectedBtn').addEventListener('click', () => {
    printTableAutoTable(true);
  });
  

  // Função para buscar os usuários (certifique-se de ter uma rota '/admin/users' que retorne { matricula, nome } para cada usuário)
function fetchUsers() {
  const token = localStorage.getItem('token');
  return fetch('/admin/users', { headers: { 'Authorization': 'Bearer ' + token } })
    .then(res => res.json())
    .catch(err => {
      console.error('Erro ao buscar usuários:', err);
      return [];
    });
}

// Função para preencher o offcanvas com a lista de usuários
function populateUserList() {
  fetchUsers().then(users => {
    const container = document.getElementById('userListContainer');
    container.innerHTML = ''; // Limpa a lista atual
    users.forEach(user => {
      // Cria um botão para cada usuário
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'list-group-item list-group-item-action';
      btn.dataset.matricula = user.matricula;
      btn.innerText = `${user.matricula} - ${user.nome}`;
      // Ao clicar, preenche o campo e fecha o offcanvas
      btn.addEventListener('click', () => {
        document.getElementById('bulkMatricula').value = user.matricula;
        // Fecha o offcanvas
        const offcanvasEl = document.getElementById('userListOffcanvas');
        const bsOffcanvas = bootstrap.Offcanvas.getInstance(offcanvasEl) || new bootstrap.Offcanvas(offcanvasEl);
        bsOffcanvas.hide();
      });
      container.appendChild(btn);
    });
  });
}

// Ao clicar no input de bulkMatricula, abre o offcanvas e preenche a lista
document.getElementById('bulkMatricula').addEventListener('click', () => {
  // Preenche a lista antes de abrir
  populateUserList();
  // Abre o offcanvas
  const offcanvasEl = document.getElementById('userListOffcanvas');
  const bsOffcanvas = new bootstrap.Offcanvas(offcanvasEl);
  bsOffcanvas.show();
});

// (Os demais códigos de eventos já existentes permanecem inalterados)



function scheduleTokenExpirationRedirect() {
  const token = localStorage.getItem('token');
  if (!token) return;

  try {
    // O JWT tem o formato: header.payload.signature
    const payloadBase64 = token.split('.')[1];
    // Corrige a codificação base64, se necessário
    const payloadJson = atob(payloadBase64);
    const payload = JSON.parse(payloadJson);
    
    // "exp" é o tempo de expiração em segundos (Unix time)
    const exp = payload.exp;
    const currentTime = Date.now() / 1000; // em segundos
    const timeRemaining = exp - currentTime;

    console.log(`Token expira em ${timeRemaining} segundos.`);

    if (timeRemaining <= 0) {
      // Se o token já expirou, redirecione imediatamente.
      localStorage.removeItem('token');
      localStorage.removeItem('userInfo');
      window.location.href = '/login';
    } else {
      // Agenda o redirecionamento para quando o token expirar.
      setTimeout(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('userInfo');
        window.location.href = '/';
      }, timeRemaining * 1000); // setTimeout trabalha com milissegundos
    }
  } catch (error) {
    console.error("Erro ao decodificar o token:", error);
  }
}

// Chame essa função logo após carregar o token, por exemplo, no início do seu script principal:
scheduleTokenExpirationRedirect();
