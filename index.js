const express = require("express");
const { graphqlHTTP } = require("express-graphql");
const { buildSchema } = require("graphql");
const { importSchema } = require("graphql-import");
const graphqlSchemas = importSchema("./schemas/graphql.gql");
const { graphqlUploadExpress } = require("graphql-upload");

const jwtExpressMiddleware = require("express-jwt");

const jwt = require("jsonwebtoken");
// const jwksRsa = require("jwks-rsa");
const bodyParser = require("body-parser");
const { Sequelize, Op } = require("sequelize");
const initModels = require("./models/init-models");
const fs = require("fs");
const { uuid } = require("uuidv4");

require("dotenv").config();

const MY_JWT_SECRET = "my-secret-jwt";

const sequelize = new Sequelize("instagram-data", "root", "password", {
  host: "localhost",
  dialect: "mysql",
});

const storeFS = ({ stream, filename }) => {
  const uploadDir = "./assets";
  const path = `${uploadDir}/${filename}`;
  return new Promise((resolve, reject) =>
    stream
      .on("error", (error) => {
        if (stream.truncated)
          // delete the truncated file
          fs.unlinkSync(path);
        reject(error);
      })
      .pipe(fs.createWriteStream(path))
      .on("error", (error) => reject(error))
      .on("finish", () => resolve({ path: `/${filename}` }))
  );
};

(async function () {
  try {
    await sequelize.authenticate();
    console.log("Connection has been established successfully.");
    const models = initModels(sequelize);

    const schema = buildSchema(graphqlSchemas);

    const resolvers = {
      allUsers: async () => {
        return models.user.findAll();
      },
      allPosts: async ({ page }) => {
        const limit = 6;
        const posts = await models.post.findAll({
          offset: (page - 1) * limit,
          limit,
        });
        const totalPosts = await models.post.count();

        return {
          page,
          total_pages: Math.ceil(totalPosts / limit),
          posts,
        };
      },
      userPosts: async ({ user_id, page }) => {
        const limit = 6;

        const posts = await models.post.findAll({
          offset: (page - 1) * limit,
          limit,
          where: {
            user_id: {
              [Op.eq]: user_id,
            },
          },
        });

        const totalPosts = await models.post.count({
          where: {
            user_id: {
              [Op.eq]: user_id,
            },
          },
        });

        return {
          page,
          total_pages: Math.ceil(totalPosts / limit),
          posts,
        };
      },
      addPost: async (args, req) => {
        const { description } = args;
        const { filename, createReadStream } = args.file.file;
        const stream = createReadStream();
        const pathObj = await storeFS({ stream, filename });
        const src = pathObj.path;

        const photo = await models.post.create({
          src,
          description,
          user_id: req.user.user_id,
        });

        return photo;
      },
    };

    const PORT = 3000;
    const app = express();

    app.use(bodyParser.json());

    app.post("/login", (req, res) => {
      models.user
        .findOne({
          where: {
            name: {
              [Op.eq]: req.body.name,
            },
            password: {
              [Op.eq]: req.body.password,
            },
          },
        })
        .then((data) => {
          if (data) {
            const token = jwt.sign(data.dataValues, MY_JWT_SECRET, {
              expiresIn: "1h",
            });

            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ token }));
          } else {
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "Invalid credentials" }));
          }
        });
    });

    app.post("/signup", (req, res) => {
      models.user
        .findOrCreate({
          where: {
            name: {
              [Op.eq]: req.body.name,
            },
          },
          defaults: {
            user_id: uuid(),
            name: req.body.name,
            password: req.body.password,
          },
        })
        .then(([data, isCreated]) => {
          if (isCreated) {
            const token = jwt.sign(data.dataValues, MY_JWT_SECRET, {
              expiresIn: "1h",
            });

            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ token }));
          } else {
            res.setHeader("Content-Type", "application/json");
            res.end(
              JSON.stringify({ error: "user with this name already exists" })
            );
          }
        });
    });

    app.use(
      jwtExpressMiddleware({ secret: MY_JWT_SECRET, algorithms: ["HS256"] })
    );

    app.use(
      "/graphql",
      graphqlUploadExpress({ maxFileSize: 10000, maxFiles: 10 }),
      graphqlHTTP({
        schema: schema,
        rootValue: resolvers,
        graphiql: true,
      })
    );

    app.use(express.static("assets"));

    app.listen(PORT);
  } catch (error) {
    console.error(error);
  }
})();
