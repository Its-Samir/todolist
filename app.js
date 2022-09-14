const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const _ = require('lodash');

let app = express();

mongoose.connect("mongodb://localhost:27017/todolistDB", { useNewUrlParser: true });

const itemSchema = new mongoose.Schema({
    name: String
});

const Items = mongoose.model("Items", itemSchema);

const a = new Items({
    name: "Welcome to this Site!"
});

const b = new Items({
    name: "Add your notes or list here."
});

const c = new Items({
    name: "<--- Hit this checkbox to delete an item."
});

const defaultItems = [a, b, c];

const listOfParameter = new mongoose.Schema({
    name: String,
    listItem: [itemSchema]
});

const List = mongoose.model('List', listOfParameter);

app.set('view engine', 'ejs');

app.use(express.static('public'));

app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req, res) => {

    Items.find({}, (err, result) => {
        if (result.length === 0) {
            Items.insertMany(defaultItems, function (err) {
                if (!err) {
                    console.log('Inserted');
                }
            });
            res.redirect('/');
        } else {
            res.render('list', { currentTitle: "Today's Schedule", newItems: result });
        }
    });
});


app.post("/", (req, res) => {

    let itemName = req.body.inputItem;
    let nameOfList = req.body.addItem;

    const item = new Items({
        name: itemName
    });

    if (nameOfList === "Today's Schedule") {
        item.save();
        res.redirect("/");
    } else {
        List.findOne({name: nameOfList}, (err, foundList)=> {
            foundList.listItem.push(item);
            foundList.save();
            res.redirect(nameOfList);
        });
    }
    
});

app.post("/delete", (req, res)=> {
    const checkedItemId = req.body.checkbox;
    const hiddenInput = req.body.hiddenTextBox;
    
    if (hiddenInput === "Today's Schedule") {
        Items.findByIdAndRemove(checkedItemId, (err)=> {
            if (!err) {
                console.log("Deleted");
                res.redirect("/");
            }
        });
    } else {
        List.findOneAndUpdate({name: hiddenInput}, {$pull: {listItem: {_id: checkedItemId}}}, (err, foundList)=> {
            if (!err) {
                res.redirect(hiddenInput);
            }
        });
    }
   
});

app.get("/:parameter", (req, res)=> {
    const listByParams = req.params.parameter;
    const upperFirstLetter = _.capitalize(listByParams);

    List.findOne({name: upperFirstLetter}, (err, foundParam)=> {
        if(!err) {
            if(!foundParam) {
                const listName = new List({
                    name: upperFirstLetter,
                    listItem: defaultItems
                    
                });
                
                listName.save();

                res.redirect(upperFirstLetter);
            }
            else {
                res.render('list', { currentTitle: foundParam.name, newItems: foundParam.listItem });
            }
        }
       
    });

});



app.get("/about", (req, res) => {
    res.render('about');
});


app.listen(3000, () => {
    console.log("Running...");
});