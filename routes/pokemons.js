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

//GET all Pokemons or Pokemons with filter
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
    const file = fs.readFileSync("pokemons.json", "utf-8");
    const { data } = JSON.parse(file);

    let result = [];

    if (filterKeys.length) {
      if (filterQuery.type) {
        const searchQuery = filterQuery.type.toLowerCase();
        result = data.filter((pokemon) => pokemon.types.includes(searchQuery));
      }

      if (filterQuery.search) {
        const searchQuery = filterQuery.search.toLocaleLowerCase();
        result = data.filter((pokemon) => {
          return (
            pokemon.name.includes(searchQuery) ||
            pokemon.types.includes(searchQuery)
          );
        });
      }
      //if query have key "search" or "types" return pokemon after applied filter
    } else {
      //if query dont have "search" or "type" key return all pokemon
      result = data;
    }

    let offset = limit * (page - 1);
    result = result.slice(offset, offset + limit);

    res.status(200).send({ data: result });
  } catch (err) {
    err.statusCode = 404;
    next(err);
  }
});

//Get a Pokemon with id
router.get("/:id", function (req, res, next) {
  try {
    const { id } = req.params;
    const file = fs.readFileSync("pokemons.json", "utf-8");
    const { data } = JSON.parse(file);

    const pokemonById = data.find((pokemon) => pokemon.id === id);

    if (!pokemonById) {
      throw new Error(`Pokemon with id: ${id} was not found`);
    }

    const pokemonIndex = data.findIndex((pokemon) => pokemon.id === id);
    const previousPokemon =
      data[(pokemonIndex - 1 + data.length) % data.length];
    const nextPokemon = data[(pokemonIndex + 1) % data.length];

    const result = {
      pokemon: pokemonById,
      previousPokemon: previousPokemon,
      nextPokemon: nextPokemon,
    };

    res.status(200).send({ data: result });
  } catch (err) {
    err.statusCode = 404;
    next(err);
  }
});

//POST new pokemon to data
router.post("/", function (req, res, next) {
  try {
    const { name, id, url, types } = req.body;

    const file = fs.readFileSync("pokemons.json", "utf-8");
    const { data, totalPokemons } = JSON.parse(file);

    // name = name?.trim()?.toLowerCase();
    // url = url?.trim()?.toLowerCase();
    // id = id?.trim()?.toLowerCase();
    // types.forEach((type) => {
    //   type.trim()?.toLowerCase();
    // });

    if (!name || !id || !url || !types) {
      throw new Error("Missing body part");
    }

    if (types.length > 2) {
      throw new Error("Only 2 types are allowed");
    }

    const newTypes = [];
    types.forEach((type) => {
      if (!pokemonTypes.includes(type)) {
        throw new Error("Pokemon's type is invalid");
      }
      newTypes.push(type);
    });

    data.forEach((pokemon) => {
      if (pokemon.name === name || pokemon.id === id) {
        throw new Error("Pokemon is already exist in database");
      }
    });

    const newPokemon = {
      name,
      types: [...newTypes],
      id,
      url,
    };

    const result = {
      data: [...data, newPokemon],
      totalPokemons: totalPokemons + 1,
    };

    fs.writeFileSync("pokemons.json", JSON.stringify(result));

    res.status(200).send(newPokemon);
  } catch (err) {
    err.statusCode = 404;
    next(err);
  }
});

//PUT update a pokemon by id
router.put("/:id", function (req, res, next) {
  try {
    const allowUpdate = ["name", "types"];
    const { id } = req.params;
    const updates = req.body;
    const updateKeys = Object.keys(updates);

    const notAllow = updateKeys.filter((key) => !allowUpdate.includes(key));

    if (notAllow.length) {
      throw new Error("Update field not allow");
    }

    let file = fs.readFileSync("pokemons.json", "utf-8");
    file = JSON.parse(file);
    const { data } = file;

    const pokemonIndex = data.findIndex((pokemon) => pokemon.id === id);
    console.log(pokemonIndex);

    if (!pokemonIndex) {
      throw new Error("Pokemon was not founded");
    }
    console.log(file.data[pokemonIndex]);

    const updatedPokemon = { ...file.data[pokemonIndex], ...updates };
    file.data[pokemonIndex] = updatedPokemon;

    fs.writeFileSync("pokemons.json", JSON.stringify(file));

    res.status(200).send(updatedPokemon);
  } catch (err) {
    err.statusCode = 404;
    next(err);
  }
});

//DELETE Pokemon by id
router.delete("/:id", function (req, res, next) {
  try {
    const { id } = req.params;
    const file = fs.readFileSync("pokemons.json", "utf-8");

    let { data, totalPokemons } = JSON.parse(file);

    const targetIndex = data.findIndex((pokemon) => pokemon.id === id);

    if (targetIndex < 0) {
      const exception = new Error("Pokemon was not found");
      exception.statusCode = 404;
      throw exception;
    }

    data = data.filter((pokemon) => pokemon.id !== id);

    const result = {
      data: data,
      totalPokemons: totalPokemons - 1,
    };

    fs.writeFileSync("pokemons.json", JSON.stringify(result));

    res.status(200).send({});
  } catch (err) {
    err.statusCode = 404;
    next(err);
  }
});

module.exports = router;
