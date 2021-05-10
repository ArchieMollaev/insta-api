module.exports = function (sequelize, DataTypes) {
  return sequelize.define(
    "user",
    {
      user_id: {
        type: DataTypes.STRING(50),
        allowNull: false,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      password: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
    },
    {
      sequelize,
      tableName: "user",
      timestamps: false,
      indexes: [
        {
          name: "PRIMARY",
          unique: true,
          using: "BTREE",
          fields: [{ name: "user_id" }],
        },
      ],
    }
  );
};
