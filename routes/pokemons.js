var express = require("express");
var router = express.Router();
const fs = require("fs");

const pokemonTypes = [
  "bug",
  "dragon",
  "fairy",
  "fire",
  "ghost",
  "ground",
  "normal",
  "psychic",
  "steel",
  "dark",
  "electric",
  "fighting",
  "flyingText",
  "grass",
  "ice",
  "poison",
  "rock",
  "water",
];

router.get("/", function (req, res, next) {
  const allowedFilter = ["page", "limit", "search", "type"];
  try {
    let { page, limit, ...filterQuery } = req.query;

    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    //throw exception if query include not allow key
    const filterKeys = Object.keys(filterQuery);
    filterKeys.forEach((key) => {
      if (!allowedFilter.includes(key)) {
        const exception = new Error(`Query ${key} is not allowed`);
        exception.statusCode = 401;
        throw exception;
      }
      if (!filterQuery[key]) delete filterQuery[key];
    });

    //read data from .json file then parse to JSON object
    const data = fs.readFileSync("pokemons.json", "utf-8");
    const pokemons = JSON.parse(data);

    let result = [];

    if (filterKeys.length) {
      filterKeys.forEach((key) => {
        pokemons.data =
          key === "search"
            ? pokemons.data.filter(
                (pokemon) =>
                  pokemon.name.includes(
                    filterQuery[key].trim().toLowerCase()
                  ) ||
                  pokemon.types.includes(filterQuery[key].trim().toLowerCase())
              )
            : pokemons.data.filter((pokemon) => {
                pokemon.types.includes(filterQuery[key].trim().toLowerCase());
              });
      });
      //if query have key "search" or "types" return pokemon after applied filter
      result = pokemons.data;
    } else {
      //if query dont have "search" or "type" key return all pokemon
      result = pokemons.data;
    }

    let offset = limit * (page - 1);
    result = result.slice(offset, offset + limit);

    res.status(200).send({ data: result });
  } catch (err) {
    err.statusCode = 404;
    next(err);
  }
});

module.exports = router;
