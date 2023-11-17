const { Schema, model } = require("mongoose");

let AuthSchema = new Schema({
  _id: String,
  totps: [
    {
      name: String,
      key: String,
    },
  ],
  hotps: [
    {
      name: String,
      key: String,
      counter: Number,
    },
  ],
});

module.exports = {
  Auth: model("auth", AuthSchema),
};
