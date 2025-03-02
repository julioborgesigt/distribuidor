// /models/index.js
const { Sequelize } = require('sequelize');
const UserModel = require('./user');
const ProcessModel = require('./process');

// Ajuste aqui suas credenciais e nome do banco
const sequelize = new Sequelize('distribuidor_proc', 'distribuidor', '-C)W1aQ6nG9(Vbr1s7', {
  host: 'sao.domcloud.co',
  dialect: 'mysql',
  dialectOptions: {
    charset: 'utf8mb4',
  },
  port: 3306,  // descomente caso precise especificar porta
  logging: false // para não ficar exibindo queries no console
});


// Carrega os models
const User = UserModel(sequelize);
const Process = ProcessModel(sequelize);

// Relacionamentos (1-N: 1 usuário pode ter vários processos)
User.hasMany(Process, { foreignKey: 'userId' });
Process.belongsTo(User, { foreignKey: 'userId' });

module.exports = {
  sequelize,
  User,
  Process
};
