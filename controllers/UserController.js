// /controllers/userController.js
const { Process, User } = require('../models');
const moment = require('moment-timezone');

exports.listUserProcesses = async (req, res) => {
  try {
    const userId = req.userId;
    const processos = await Process.findAll({
      where: { userId },
      include: User
    });
    return res.json(processos);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao buscar processos' });
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
