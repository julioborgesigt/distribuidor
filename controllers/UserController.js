// /controllers/userController.js
const { Process, User } = require('../models');
const moment = require('moment-timezone');

exports.listUserProcesses = async (req, res) => {
  console.log("listUserProcesses: Iniciando listagem de processos para o usuário com ID:", req.userId);
  try {
    const userId = req.userId;
    const processos = await Process.findAll({
      where: { userId },
      include: User
    });
    console.log("listUserProcesses: Processos encontrados:", processos.length);
    return res.json(processos);
  } catch (error) {
    console.error("listUserProcesses: Erro ao buscar processos:", error);
    return res.status(500).json({ error: 'Erro ao buscar processos' });
  }
};

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


exports.marcarCumprido = async (req, res) => {
  try {
    const { processId, cumprido, resetReiteracoes } = req.body;
    const process = await Process.findByPk(processId);
    if (!process) {
      return res.status(404).json({ error: 'Processo não encontrado' });
    }
    
    // Atualiza o status "cumprido"
    process.cumprido = cumprido;
    
    if (cumprido) {
      // Registra a data/hora atual (horário de Brasília) quando marcado como cumprido
      process.cumpridoDate = moment().tz('America/Sao_Paulo').toDate();
      if (resetReiteracoes) {
        process.reiteracoes = 0;
      }
    } else {
      // Opcionalmente, limpe a data se desmarcado
      process.cumpridoDate = null;
    }
    
    await process.save();
    return res.json({ message: 'Processo atualizado com sucesso' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao atualizar o processo' });
  }
};

exports.updateObservacoes = async (req, res) => {
  const { processId, observacoes } = req.body;
  try {
    const process = await Process.findByPk(processId);
    if (!process) {
      return res.status(404).send('Processo não encontrado.');
    }
    process.observacoes = observacoes;
    await process.save();
    res.send('Observações atualizadas com sucesso.');
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro ao atualizar observações.');
  }
};
