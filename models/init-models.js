var DataTypes = require("sequelize").DataTypes;
var _comment = require("./comment");
var _post = require("./post");
var _user = require("./user");

function initModels(sequelize) {
  var comment = _comment(sequelize, DataTypes);
  var post = _post(sequelize, DataTypes);
  var user = _user(sequelize, DataTypes);

  comment.belongsTo(post, { as: "post", foreignKey: "post_id"});
  post.hasMany(comment, { as: "comments", foreignKey: "post_id"});
  post.belongsTo(user, { as: "user", foreignKey: "user_id"});
  user.hasMany(post, { as: "posts", foreignKey: "user_id"});

  return {
    comment,
    post,
    user,
  };
}
module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;
