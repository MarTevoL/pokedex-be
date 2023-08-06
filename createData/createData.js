const fs = require("fs");
const csv = require("csvtojson");
const { set } = require("../app");
const TOTAL_POKEMON = 721;

const createData = async () => {
  //read data from .csv file
  let data = await csv().fromFile("pokemon.csv");
  //change data to Set to remove duplicate and slice from 0 to TOTAL_POKEMON
  data = new Set(data);
  data = Array.from(data).slice(0, TOTAL_POKEMON);

  data = data.map((pokemon, index) => ({
    name: pokemon.Name,
    types: pokemon.Type2
      ? [pokemon.Type1.toLowerCase(), pokemon.Type2.toLowerCase()]
      : [pokemon.Type1.toLowerCase()],
    id: String(index + 1),
    url: `http://localhost:8000/images/${index}.png`,
  }));

  console.log(data);
  const pokemons = { data: data, totalPokemons: data.length };

  fs.writeFileSync("../pokemons.json", JSON.stringify(pokemons));
};

createData();
