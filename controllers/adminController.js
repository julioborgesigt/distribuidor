// /controllers/adminController.js
const path = require('path');
const fs = require('fs');
const csvParser = require('csv-parser');
const { User, Process } = require('../models');

// Retorna a página HTML de administrador
exports.getAdminPage = (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'admin.html'));
};


// Upload e importação de CSV
exports.uploadCSV = (req, res) => {
  if (!req.file) {
    return res.status(400).send('Nenhum arquivo foi enviado.');
  }

  const filePath = req.file.path;
  const results = [];
  const iconv = require('iconv-lite');

  // Função para converter data do formato "dd/mm/yyyy" para "yyyy-mm-dd"
  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    const parts = dateStr.split('/');
    if (parts.length !== 3) return null;
    const [day, month, year] = parts;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  };

  const normalizeHeader = (header) => {
    let norm = header.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    norm = norm.replace(/�/g, 'u');
    norm = norm.trim();
    return norm;
  };

  fs.createReadStream(filePath)
    // Converte do encoding original (ex: 'latin1') para UTF-8
    .pipe(iconv.decodeStream('latin1'))
    .pipe(iconv.encodeStream('utf8'))
    .pipe(csvParser({ 
      separator: ';', 
      mapHeaders: ({ header }) => normalizeHeader(header)
    }))
    .on('data', (data) => {
      console.log('Chaves lidas:', Object.keys(data));
      // Verifica se a linha possui um valor não vazio para "Numero do processo"
      if (data['Numero do processo'] && data['Numero do processo'].trim() !== '') {
        results.push({
          numero_processo: data['Numero do processo'],
          prazo_processual: data['Prazo processual'],
          classe_principal: data['Classe principal'],
          assunto_principal: data['Assunto principal'],
          tarjas: data['Tarjas'],
          data_intimacao: parseDate(data['Data da intimacao'])
        });
      }
    })
    .on('end', async () => {
      console.log('Linhas capturadas:', results);
      try {
        for (let row of results) {
          const existing = await Process.findOne({ where: { numero_processo: row.numero_processo } });
          if (existing) {
            // Cria objeto para atualizar somente os campos alterados
            const updateData = {};
            if (row.prazo_processual !== existing.prazo_processual) {
              updateData.prazo_processual = row.prazo_processual;
            }
            if (row.classe_principal !== existing.classe_principal) {
              updateData.classe_principal = row.classe_principal;
            }
            if (row.assunto_principal !== existing.assunto_principal) {
              updateData.assunto_principal = row.assunto_principal;
            }
            if (row.tarjas !== existing.tarjas) {
              updateData.tarjas = row.tarjas;
            }
            // Tratamento da data de intimação
            if (row.data_intimacao !== existing.data_intimacao) {
              if (!existing.data_intimacao) {
                // Se não houver data armazenada, atualiza e inicia contador
                updateData.data_intimacao = row.data_intimacao;
                updateData.cumprido = false;
                updateData.reiteracoes = 1;
              } else {
                const newDate = new Date(row.data_intimacao);
                const storedDate = new Date(existing.data_intimacao);
                // Se a nova data for mais recente
                if (newDate > storedDate) {
                  updateData.data_intimacao = row.data_intimacao;
                  updateData.cumprido = false;
                  // Se o processo já estava marcado como "não cumprido", incrementa o contador;
                  // Se estava cumprido, inicia o contador em 1
                  updateData.reiteracoes = (existing.cumprido === false ? (existing.reiteracoes || 0) + 1 : 1);
                }
                // Se a nova data for igual ou anterior, não atualiza a data nem o contador
              }
            }
            // Se houver algum campo alterado, realiza o update
            if (Object.keys(updateData).length > 0) {
              await existing.update(updateData);
            }
          } else {
            // Se o processo não existir, cria-o
            // O model define os valores padrão: cumprido = false, reiteracoes = 0
            await Process.create(row);
          }
        }
        fs.unlinkSync(filePath);
        res.send('CSV importado com sucesso.');
      } catch (error) {
        console.error(error);
        res.status(500).send('Erro ao salvar dados do CSV.');
      }
    })
    .on('error', (error) => {
      console.error(error);
      res.status(500).send('Erro ao ler o arquivo CSV.');
    });
};


// Lista todos os processos em formato JSON
exports.listProcesses = async (req, res) => {
  try {
    // Inclui o usuário (se tiver) no retorno
    const processes = await Process.findAll({ include: User });
    res.json(processes);
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro ao buscar processos.');
  }
};

// Atribuição automática de processos
exports.assignProcesses = async (req, res) => {
  // Conforme descrição: "o sistema irá procurar cada processo na base de dados
  // e atribuir ao usuário que já tenha sido atribuído aquele processo alguma vez."
  // Na prática, seria necessário ter um histórico de atribuições. Como não temos,
  // deixamos a lógica de exemplo:
  res.send('Atribuição automática simulada (lógica não implementada).');
};

// Atribuição manual de um processo
exports.manualAssignProcess = async (req, res) => {
  const { numeroProcesso, matricula } = req.body;
  console.log("Dados recebidos:", req.body);

  try {
    const user = await User.findOne({ where: { matricula } });
    if (!user) {
      console.log("Usuário não encontrado para a matrícula:", matricula);
      return res.status(404).send('Usuário não encontrado.');
    }

    // Remover espaços e padronizar, se necessário
    const numero = numeroProcesso.trim();

    const process = await Process.findOne({ where: { numero_processo: numero } });
    if (!process) {
      console.log("Processo não encontrado para o número:", numero);
      return res.status(404).send('Processo não encontrado.');
    }

    process.userId = user.id;
    await process.save();

    console.log("Processo atualizado:", process);
    res.send('Processo atribuído com sucesso.');
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro ao atribuir processo.');
  }
};


// Pré-cadastro de usuário
exports.preCadastro = async (req, res) => {
  const { matricula, nome, senha, admin_padrao, updateIfExists } = req.body;

  if (!matricula || !nome || !senha) {
    return res.status(400).send('Campos obrigatórios ausentes.');
  }

  try {
    // Verifica se já existe um usuário com a mesma matrícula
    const existingUser = await User.findOne({ where: { matricula } });
    if (existingUser) {
      if (updateIfExists) {
        // Atualiza o usuário existente
        existingUser.nome = nome;
        // Para que o usuário realize o primeiro login, definimos a senha para "12345678"
        // e marcamos senha_padrao como verdadeiro (como na função reset)
        existingUser.senha = '12345678';
        existingUser.senha_padrao = true;
        existingUser.admin_padrao = admin_padrao ? true : false;
        await existingUser.save();
        return res.send('Usuário atualizado com sucesso. Senha: 12345678');
      } else {
        return res.status(409).json({
          error: 'Usuário já cadastrado.',
          updatePrompt: 'Deseja atualizar o usuário existente?'
        });
      }
    }

    // Se não existir, cria o usuário normalmente
    await User.create({ matricula, nome, senha, admin_padrao: admin_padrao ? true : false });
    res.send('Pré-cadastro realizado com sucesso.');
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro ao realizar pré-cadastro.');
  }
};




// Reset de senha
exports.resetPassword = async (req, res) => {
  const { matricula } = req.body;

  if (!matricula) {
    return res.status(400).send('Matrícula obrigatória.');
  }

  try {
    const user = await User.findOne({ where: { matricula } });
    if (!user) {
      return res.status(404).send('Usuário não encontrado.');
    }

    // Define a senha para "12345678" e senha_padrao para 1
    user.senha = '12345678'; // Senha padrão
    user.senha_padrao = 1;  // Marca como senha padrão após reset
    await user.save();

    res.send('Senha resetada com sucesso para "12345678".');
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro ao resetar senha.');
  }
};



// Atribuição em Massa: atualiza o campo userId para os processos selecionados
exports.bulkAssign = async (req, res) => {
  try {
    const { processIds, matricula } = req.body;
    // Procura o usuário destino pela matrícula
    const user = await User.findOne({ where: { matricula } });
    if (!user) {
      return res.status(404).send("Usuário destino não encontrado.");
    }
    // Atualiza os processos cujo id esteja no array processIds
    await Process.update({ userId: user.id }, {
      where: {
        id: processIds
      }
    });
    res.send("Atribuição em massa realizada com sucesso.");
  } catch (error) {
    console.error(error);
    res.status(500).send("Erro ao realizar atribuição em massa.");
  }
};

// Exclusão em Massa: remove os processos selecionados do banco de dados
exports.bulkDelete = async (req, res) => {
  try {
    const { processIds } = req.body;
    await Process.destroy({
      where: {
        id: processIds
      }
    });
    res.send("Exclusão em massa realizada com sucesso.");
  } catch (error) {
    console.error(error);
    res.status(500).send("Erro ao realizar exclusão em massa.");
  }
};

// Marcar como Cumprido em Massa: atualiza os processos selecionados para cumprido e zera o contador de reiteracoes
exports.bulkCumprido = async (req, res) => {
  try {
    const { processIds } = req.body;
    await Process.update({ cumprido: true, reiteracoes: 0 }, {
      where: {
        id: processIds
      }
    });
    res.send("Processos marcados como cumpridos com sucesso.");
  } catch (error) {
    console.error(error);
    res.status(500).send("Erro ao atualizar status em massa.");
  }
};


// Atualiza o número de reiterações de uma intimação
exports.updateIntim = async (req, res) => {
  const { processId, reiteracoes } = req.body;
  try {
    const process = await Process.findByPk(processId);
    if (!process) {
      return res.status(404).send('Processo não encontrado.');
    }
    process.reiteracoes = reiteracoes;
    await process.save();
    res.send('Número de intim atualizado com sucesso.');
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro ao atualizar número de intim.');
  }
};
