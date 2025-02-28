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

  const normalizeHeader = (header) => {
    return header.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  };
  
  fs.createReadStream(filePath)
    .pipe(csvParser({ separator: ',' }))
    .on('data', (data) => {
      // Supondo que o CSV tenha cabeçalhos:
      // "Número do processo", "Prazo processual", "Classe principal", "Assunto principal", "Tarjas", "Data da intimação"
      // Ajuste se a planilha estiver em outra ordem ou nomes diferentes.
      const numeroProcesso = data['N�mero do processo'] || 0;
      const prazoProcessual = data['Prazo processual'] || 0;
      const classePrincipal = data['Classe principal'] || null;
      const assuntoPrincipal = data['Assunto principal'] || null;
      const tarjas = data['Tarjas'] || null;
      const dataIntimacao = data['Data da intimação'] || null;

      results.push({
        numero_processo: numeroProcesso,
        prazo_processual: prazoProcessual,
        classe_principal: classePrincipal,
        assunto_principal: assuntoPrincipal,
        tarjas: tarjas,
        data_intimacao: dataIntimacao
      });
    })
    .on('end', async () => {
      console.log('Linhas capturadas:', results); // Adicione este log para depuração
      // Inserir cada linha no banco (simplesmente "create", mas poderia ser um upsert)
      try {
        for (let row of results) {
          await Process.create(row);
        }
        fs.unlinkSync(filePath); // remove o arquivo temporário
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

  try {
    const user = await User.findOne({ where: { matricula } });
    if (!user) {
      return res.status(404).send('Usuário não encontrado.');
    }
    const process = await Process.findOne({ where: { numero_processo: numeroProcesso } });
    if (!process) {
      return res.status(404).send('Processo não encontrado.');
    }

    process.userId = user.id;
    await process.save();

    res.send('Processo atribuído com sucesso.');
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro ao atribuir processo.');
  }
};

// Pré-cadastro de usuário
exports.preCadastro = async (req, res) => {
  const { matricula, nome, senha } = req.body;

  if (!matricula || !nome || !senha) {
    return res.status(400).send('Campos obrigatórios ausentes.');
  }

  try {
    // Cria novo usuário
    await User.create({ matricula, nome, senha });
    res.send('Pré-cadastro realizado com sucesso.');
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro ao realizar pré-cadastro.');
  }
};

// Reset de senha
exports.resetPassword = async (req, res) => {
  const { matricula, newPassword } = req.body;

  if (!matricula || !newPassword) {
    return res.status(400).send('Campos obrigatórios ausentes.');
  }

  try {
    const user = await User.findOne({ where: { matricula } });
    if (!user) {
      return res.status(404).send('Usuário não encontrado.');
    }
    user.senha = newPassword;
    await user.save();
    res.send('Senha resetada com sucesso.');
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro ao resetar senha.');
  }
};
