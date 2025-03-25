// /models/user.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: { 
      type: DataTypes.INTEGER, 
      autoIncrement: true, 
      primaryKey: true 
    },
    matricula: {
      type: DataTypes.STRING(20),
      allowNull: false,
      
    },
    nome: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    senha: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    // Novo campo para identificar se \u00e9 a senha padr\u00e3o
    senha_padrao: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    admin_padrao: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    admin_super: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  }, {
    tableName: 'usuarios',
    timestamps: false
  });

  return User;
};
