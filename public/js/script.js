
    // Variáveis globais para armazenar processos
    let allProcesses = [];
    let filteredProcesses = [];
    let currentChartType = 'todos';


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
      // Primeiro, atualize o layout do cabeçalho com base na largura da tela
      const header = document.querySelector('.chart-header');
      if (window.innerWidth < 768) {
        header.style.flexDirection = 'column';
        header.style.alignItems = 'center';
        const toggleContainer = header.querySelector('.chart-toggle-container');
        toggleContainer.style.alignSelf = 'flex-end';
        toggleContainer.style.marginTop = '-25px';
        toggleContainer.style.marginLeft = '25px';
        
      } else {
        header.style.flexDirection = 'row';
        header.style.alignItems = 'center';
        const toggleContainer = header.querySelector('.chart-toggle-container');
        toggleContainer.style.alignSelf = '';
        toggleContainer.style.marginTop = '';
        
      }
    
      // A seguir, o código de atualização dos gráficos permanece o mesmo
      const container = document.getElementById('statsRow');
      container.innerHTML = '';
    
      // Define o conjunto de processos a serem contados
      let processesToCount = [];
      if (currentChartType === 'cumprido') {
        const now = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);
        // Filtra para considerar apenas os processos cumpridos nos últimos 30 dias
        processesToCount = allProcesses.filter(proc =>
          proc.cumprido &&
          proc.cumpridoDate &&
          new Date(proc.cumpridoDate) >= thirtyDaysAgo
        );
      } else {
        processesToCount = allProcesses;
      }
    
      const total = processesToCount.length;
      const labelTotal = currentChartType === 'cumprido' ? 'T.Cump.' : 'TOTAL';
      container.appendChild(createChartCircle(labelTotal, 100, total));
    
      // Agrupa os processos por usuário
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
    
      if (currentChartType === 'todos') {
        let overdue = 0, urgent = 0, upcoming = 0, preso = 0, homicid = 0, furtos = 0, roubos = 0;
        allProcesses.forEach(proc => {
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
        });
    
        container.appendChild(createChartCircle('Vencidos', (overdue / allProcesses.length) * 100, overdue));
        container.appendChild(createChartCircle('P < 10d', (urgent / allProcesses.length) * 100, urgent));
        container.appendChild(createChartCircle('P < 30d', (upcoming / allProcesses.length) * 100, upcoming));
        container.appendChild(createChartCircle('R.Preso', (preso / allProcesses.length) * 100, preso));
        container.appendChild(createChartCircle('Homic.', (homicid / allProcesses.length) * 100, homicid));
        container.appendChild(createChartCircle('Roubos', (roubos / allProcesses.length) * 100, roubos));
        container.appendChild(createChartCircle('Furtos', (furtos / allProcesses.length) * 100, furtos));
      }
    }
    
    function limitChartContainerWidth() {
      const chartContainer = document.getElementById('chartContainer');
      if (window.innerWidth < 768) {
        chartContainer.style.setProperty('width', '320px', 'important');
        chartContainer.style.setProperty('max-width', '320px', 'important');
      } else {
        chartContainer.style.removeProperty('width');
        chartContainer.style.removeProperty('max-width');
      }
    }
    
    document.addEventListener('DOMContentLoaded', limitChartContainerWidth);
    window.addEventListener('resize', limitChartContainerWidth);
    

    

    document.addEventListener('DOMContentLoaded', () => {
      fetchProcesses();
      document.getElementById('filtroClasse').addEventListener('change', filterAndRenderTable);
      document.getElementById('filtroAssunto').addEventListener('change', filterAndRenderTable);
      document.getElementById('filtroTarjas').addEventListener('change', filterAndRenderTable);
      document.getElementById('filtroUsuario').addEventListener('change', filterAndRenderTable);
      document.getElementById('ordenarPrazo').addEventListener('change', filterAndRenderTable);
      document.getElementById('ordenarData').addEventListener('change', filterAndRenderTable);
      document.getElementById('ordenarDias').addEventListener('change', filterAndRenderTable);

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
      fetch('/admin/processes')
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

      filtroClasse.innerHTML = '<option value="">Todos</option>';
      filtroAssunto.innerHTML = '<option value="">Todos</option>';
      filtroTarjas.innerHTML = '<option value="">Todos</option>';
      filtroUsuario.innerHTML = '<option value="">Todos</option>';

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

      classes.forEach(item => {
        const option = document.createElement('option');
        option.value = item;
        option.textContent = item;
        filtroClasse.appendChild(option);
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
      usuarios.forEach(item => {
        const option = document.createElement('option');
        option.value = item;
        option.textContent = item;
        filtroUsuario.appendChild(option);
      });
    }

    function filterAndRenderTable() {
      const filtroClasse = document.getElementById('filtroClasse').value;
      const filtroAssunto = document.getElementById('filtroAssunto').value;
      const filtroTarjas = document.getElementById('filtroTarjas').value;
      const filtroUsuario = document.getElementById('filtroUsuario').value;
      const ordenarPrazo = document.getElementById('ordenarPrazo').value;
      const ordenarData = document.getElementById('ordenarData').value;
      const ordenarDias = document.getElementById('ordenarDias').value;

      filteredProcesses = allProcesses.filter(proc => {
        let match = true;
        if (filtroClasse && proc.classe_principal !== filtroClasse) match = false;
        if (filtroAssunto && proc.assunto_principal !== filtroAssunto) match = false;
        if (filtroTarjas && proc.tarjas !== filtroTarjas) match = false;
        if (filtroUsuario) {
          const userName = proc.User ? proc.User.nome : 'nenhum';
          if (userName !== filtroUsuario) match = false;
        }
        return match;
      });

      if (ordenarPrazo) {
        filteredProcesses.sort((a, b) => {
          const aPrazo = parseInt(a.prazo_processual) || 0;
          const bPrazo = parseInt(b.prazo_processual) || 0;
          return ordenarPrazo === 'asc' ? aPrazo - bPrazo : bPrazo - aPrazo;
        });
      }

      if (ordenarData) {
        filteredProcesses.sort((a, b) => {
          const aDate = new Date(a.data_intimacao);
          const bDate = new Date(b.data_intimacao);
          return ordenarData === 'asc' ? aDate - bDate : bDate - aDate;
        });
      }

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
          <td>${reiteracoes}</td>
          <td class="hide-mobile">${statusCumprido}</td>
          <td class="hide-mobile">
            <form class="manual-assign-form">
              <input type="hidden" name="numeroProcesso" value="${proc.numero_processo}">
              <input type="text" class="form-control form-control-sm mb-2" name="matricula" placeholder="Matrícula" required maxlength="8" required>
              <button type="submit" class="btn btn-sm btn-primary">Atribuir</button>
            </form>
          </td>
        `;
        tbody.appendChild(tr);
      });

      document.querySelectorAll('.manual-assign-form').forEach(form => {
        form.addEventListener('submit', e => {
          e.preventDefault();
          const formData = new FormData(form);
          const data = {
            numeroProcesso: formData.get('numeroProcesso'),
            matricula: formData.get('matricula')
          };
          fetch('/admin/manual-assign', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          })
          .then(res => res.text())
          .then(msg => {
            alert(msg);
            fetchProcesses();
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
      const formData = new FormData(preCadastroForm);
      const data = {
        matricula: formData.get('matricula'),
        nome: formData.get('nome'),
        senha: formData.get('senha')
      };
      fetch('/admin/pre-cadastro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      .then(res => res.text())
      .then(msg => {
        alert(msg);
        preCadastroForm.reset();
      })
      .catch(err => console.error(err));
    });

    // Reset de senha
    const resetPasswordForm = document.getElementById('resetPasswordForm');
    resetPasswordForm.addEventListener('submit', e => {
      e.preventDefault();
      const formData = new FormData(resetPasswordForm);
      const data = {
        matricula: formData.get('matriculaReset'),
        newPassword: formData.get('newPassword')
      };
      fetch('/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      .then(res => res.text())
      .then(msg => {
        alert(msg);
        resetPasswordForm.reset();
      })
      .catch(err => console.error(err));
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
        headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
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


