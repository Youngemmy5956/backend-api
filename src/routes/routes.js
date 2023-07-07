import express from "express";
import Model from "../model/users.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Item_model from "../model/items.js";
import Cart_model from "../model/carts.js";
import Order_model from "../model/orders.js";
// import auth from "../middleware/auth.js";

const router = express.Router();


// get cart

router.get("/cart",   async (req, res) => {
  const owner = req.user._id;
  try {
      const cart = await Cart_model.findOne({ owner });
  if (cart && cart.items.length > 0) {
       res.status(200).send(cart);
  } else {
        res.send(null);
  }
  } catch (error) {
      res.status(500).send();
  }
  });

  // create cart

  router.post("/cart", async (req, res) => {
const owner = req.user._id;
const { itemId, quantity } = req.body;
try {
    const cart = await Cart_model.findOne({ owner });
    const item = await Item_model.findOne({ _id: itemId });
if (!item) {
    res.status(404).send({ message: "item not found" });
    return;
}
    const price = item.price;
    const name = item.name;
//If cart already exists for user,
if (cart) {
    const itemIndex = cart.items.findIndex((item) => item.itemId ==  itemId);
//check if product exists or not
if (itemIndex > -1) {
    let product = cart.items[itemIndex];
    product.quantity += quantity;
    cart.bill = cart.items.reduce((acc, curr) => {
       return acc + curr.quantity * curr.price;
   },0)
cart.items[itemIndex] = product;
   await cart.save();
   res.status(200).send(cart);
} else {
   cart.items.push({ itemId, name, quantity, price });
   cart.bill = cart.items.reduce((acc, curr) => {
   return acc + curr.quantity * curr.price;
},0)
   await cart.save();
   res.status(200).send(cart);
}
} else {
//no cart exists, create one
const newCart = await Cart_model.create({
   owner,
   items: [{ itemId, name, quantity, price }],
    bill: quantity * price,
});
return res.status(201).send(newCart);
}
} catch (error) {
   console.log(error);
   res.status(500).send("something went wrong");
}
});

// delete cart

router.delete("/cart/", async (req, res) => {
const owner = req.user._id;
const itemId = req.query.itemId;
try {
   let cart = await Cart_model.findOne({ owner });
   const itemIndex = cart.items.findIndex((item) => item.itemId == itemId);
if (itemIndex > -1) {
     let item = cart.items[itemIndex];
     cart.bill -= item.quantity * item.price;
if(cart.bill < 0) {
      cart.bill = 0
}
     cart.items.splice(itemIndex, 1);
     cart.bill = cart.items.reduce((acc, curr) => {
return acc + curr.quantity * curr.price;
},0)
    cart = await cart.save();
    res.status(200).send(cart);
} else {
    res.status(404).send("item not found");
}
} catch (error) {
   console.log(error);
   res.status(400).send();
}
});

// get orders 

router.get('/orders', async (req, res) => {
const owner = req.user._id;
try {
const order = await Order_model.find({ owner: owner }).sort({ date: -1 });
res.status(200).send(order)
} catch (error) {
res.status(500).send()
}
})
// create a new item

router.post('/items', async(req, res) => {
  try {
  const newItem = new Item({
      ...req.body,
      owner: req.user._id
  })
     await newItem.save()
     res.status(201).send(newItem)
  } catch (error) {
  res.status(400).send({message: "error"})
  }
  })

  router.post()

  // fetch an item
  router.get('/items/:id', async(req, res) => {
    try{
       const item = await Item_model.findOne({_id: req.params.id})
    if(!item) {
       res.status(404).send({error: "Item not found"})
    }
       res.status(200).send(item)
    } catch (error) {
       res.status(400).send(error)
    }
    })

    // fetch all items

    router.get('/items', async(req, res) => {
      try{
          const items = await Item_model.find({})
          res.status(200).send(items)
      } catch (error) {
        res.status(400).send(error)  
      }
    })
    
    // update an item
    router.patch('/items/:id',  async(req, res) => {
      const updates = Object.keys(req.body)
      const allowedUpdates = ['name', 'description', 'category', 'price']
      const isValidOperation = updates.every((update) =>              allowedUpdates.includes(update))
         if(!isValidOperation) {
           return res.status(400).send({ error: 'invalid updates'})
      }
      try {
        const item = await Item_model.findOne({ _id: req.params.id})
        if(!item){
            return res.status(404).send()
        }
        updates.forEach((update) => item[update] = req.body[update])
        await item.save()
        res.send(item)
      } catch (error) {
      res.status(400).send(error)
      }
      })

      // delete an item
      router.delete('/items/:id', async(req, res) => {
        try {
        const deletedItem = await Item.findOneAndDelete( {_id: req.params.id} )
           if(!deletedItem) {
            res.status(404).send({error: "Item not found"})
        }
           res.send(deletedItem)
        } catch (error) {
           res.status(400).send(error)
        }
        })

// auth register

router.post("/auth/register", async (req, res) => {
  const { firstName, lastName, email, password } = req.body;
  if (password.length < 8) {
    return res
      .status(400)
      .json({ message: "password is less than 8 characters" });
  }
  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ message: "all fields are required" });
  }
  if (email.indexOf("@") === -1) {
    return res.status(400).json({ message: "invalid email" });
  }
  if (email.indexOf(".") === -1) {
    return res.status(400).json({ message: "invalid email" });
  }
  try {
    bcrypt.hash(password, 10).then(async (hash) => {
      await Model.create({ firstName, lastName, email, password: hash }).then(
        (user) => {
          const maxAge = 3 * 60 * 60;
          const token = jwt.sign(
            { id: user._id, email },
            process.env.JWT_SECRECT_KEY,
            { expiresIn: maxAge }
          );
          res.cookie("jwt", token, { httpOnly: true, maxAge: maxAge * 1000 });
          res.status(201).json({ message: "User successfully created", user });
        }
      );
    });
  } catch (err) {
    res.status(400).json({
      message: "User not successfully created",
      error: err.message,
    });
  }
});

// auth login

router.post("/auth/login", async (req, res, next) => {
  const { email, password } = req.body;
  // check if email and password is provided
  if (!email || !password) {
    return res.status(400).json({ message: "email or password not provided " });
  }
  try {
    const user = await Model.findOne({ email });
    if (!user) {
      res
        .status(400)
        .json({ message: "Login not successful", error: "User not found" });
    } else {
      bcrypt.compare(password, user.password).then(function (result) {
        if (result) {
          const maxAge = 3 * 60 * 60;
          const token = jwt.sign(
            { id: user._id, email },
            process.env.JWT_SECRECT_KEY,
            { expiresIn: maxAge }
          );

          // user.token = token;

          res.cookie("jwt", token, { httpOnly: true, maxAge: maxAge * 1000 });
          res.status(201).json({ message: "Login successful", user, token });
        } else {
          res.status(400).json({ message: "Invalid Credentials" });
        }
      });
    }
  } catch (err) {
    res.status(400).json({ message: "An error occurred", error: err.message });
  }
});

// get all data

router.get("/getAll", async (req, res) => {
  try {
    const data = await Model.find();
    res.json(data);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// get by id

router.get("/getById/:id", async (req, res) => {
  try {
    const data = await Model.findById(req.params.id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// update by id
router.patch("/update/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const updateData = req.body;
    const options = { new: true };

    const data = await Model.findByIdAndUpdate(id, updateData, options);
    res.json(data);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// delete by ID
router.delete("/delete/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const data = await Model.findByIdAndDelete(id);
    res.status(201).json({ message: "User successfully deleted", data });
    // res.send(`User with name ${data.name} has been deleted..`);
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "An error occurred",
      error: err.message,
    });
  }
});

// logout
// router.get("/logout", (req, res) => {
//   res.cookie("jwt", "", { maxAge: "1" });
//   res.redirect("/");
// });

router.post("/logout", (req, res) => {
  res.cookie("jwt", "", { maxAge: "1" });
  res.status(200).json({ message: "logout successful" });
});

export default router;
