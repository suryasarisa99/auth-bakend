const { Schema, model } = require("mongoose");

let AuthSchema = new Schema({
  _id: String,
  totps: [
    {
      name: String,
      key: String,
    },
  ],
});

module.exports = {
  Auth: model("auth", AuthSchema),
};
