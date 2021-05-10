const Sequelize = require("sequelize");
module.exports = function (sequelize, DataTypes) {
  return sequelize.define(
    "post",
    {
      post_id: {
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      description: {
        type: DataTypes.STRING(400),
        allowNull: true,
      },
      src: {
        type: DataTypes.STRING(300),
        allowNull: false,
      },
      date_stamp: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: Sequelize.Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      user_id: {
        type: DataTypes.STRING(50),
        allowNull: false,
        references: {
          model: "user",
          key: "user_id",
        },
      },
    },
    {
      sequelize,
      tableName: "post",
      timestamps: false,
      indexes: [
        {
          name: "PRIMARY",
          unique: true,
          using: "BTREE",
          fields: [{ name: "post_id" }],
        },
        {
          name: "user_id",
          using: "BTREE",
          fields: [{ name: "user_id" }],
        },
      ],
    }
  );
};
