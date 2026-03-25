const mongoose = require("mongoose")

mongoose.connect(
"mongodb+srv://kishor:kishor%402006@messages.khjyaj7.mongodb.net/webhooks"
)
.then(()=>console.log("MongoDB Connected"))
.catch(err=>console.log(err))

module.exports = mongoose