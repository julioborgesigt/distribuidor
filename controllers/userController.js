// /controllers/userController.js
const { Process, User } = require('../models');

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


// /controllers/userController.js
exports.marcarCumprido = async (req, res) => {
    try {
      const { processId, cumprido, resetReiteracoes } = req.body;
      const process = await Process.findByPk(processId);
      if (!process) {
        return res.status(404).json({ error: 'Processo não encontrado' });
      }
      // Atualiza o status "cumprido"
      process.cumprido = cumprido;
      // Se o processo for marcado como cumprido e o payload indicar que o contador deve ser zerado:
      if (cumprido && resetReiteracoes) {
        process.reiteracoes = 0;
      }
      await process.save();
      return res.json({ message: 'Processo atualizado com sucesso' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao atualizar o processo' });
    }
  };
  
  