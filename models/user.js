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
      unique: true
    },
    nome: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    senha: {
      type: DataTypes.STRING(100),
      allowNull: false
    }
  }, {
    tableName: 'usuarios',
    timestamps: false
  });

  return User;
};
