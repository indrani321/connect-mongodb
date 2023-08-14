const mongodb = require('mongodb');
const getDb = require('../util/database').getDb;

const ObjectId = mongodb.ObjectId;


class User {
  constructor(username, email,cart,_id) {
    this.name = username;
    this.email = email;
    this.cart=cart;
    this._id=_id;
  }

  save() {
    const db = getDb();
    return db.collection('users').insertOne(this);

  }
  addToCart(product) {
    const cartProductIndex = this.cart.items.findIndex(cp => {
      return cp.productId.toString() === product._id.toString();
    });
  
    let newQuantity = 1;
    const updatedCartItems = [...this.cart.items];
  
    if (cartProductIndex >= 0) {
      newQuantity = this.cart.items[cartProductIndex].quantity + 1;
      updatedCartItems[cartProductIndex].quantity = newQuantity;
    } else {
      updatedCartItems.push({
        productId: new ObjectId(product._id),
        quantity: newQuantity,
      });
    }
  
    const updateCart = { items: updatedCartItems };
    const db = getDb();
  
    return db.collection('users').updateOne(
      { _id: new ObjectId(this._id) },
      { $set: { cart: updateCart } }
    );
  }
  
  getCart() {
    const db = getDb();
    const productIds = this.cart.items.map(i => {
      return i.productId;
    });
  
    return db.collection('products')
      .find({ _id: { $in: productIds } })
      .toArray()
      .then(products => {
        const updatedCart = products.map(p => {
          const cartItem = this.cart.items.find(i => i.productId.toString() === p._id.toString());
          return {
            ...p,
            quantity: cartItem.quantity
          };
        });
  
        return updatedCart;
      });
  }
  deleteItemFromCart(productId){
    const updatedCartItems= this.cart.items.filter(item=>{
      return item.productId.toString()!==productId.toString();
    })
    const db= getDb()
    return db.collection('users')
    .updateOne(
      {_id:new ObjectId(this._id)},
      {$set:{cart:{items:updatedCartItems}}}
      )
  }
  addOrder(){
    const db= getDb();
    return this.getCart().then(products=>{
      const order={
        items:products,
        users:{
          _id:new ObjectId(this._id),
          name:this.name,
          email:this.email
        }
      }
      return db.collection('orders').insertOne(order)
    })
    .then(result=>{
      this.cart={items:[]};
      return db
      .collection('users')
      .updateOne(
        {_id:new ObjectId(this._id)},
        {$set:{cart:{items:[]}}}
        )
    })
    
  }

  getOrder(){
    const db=getDb();
    return db.collection('orders')
    .find({'users._id': new ObjectId(this._id)})
    .toArray()
  }
  static findById(userId) {
    const db = getDb();
    return db.collection('users')
    .findOne({_id: new ObjectId(userId)}).
    then(user =>{
      console.log(user);
      return user;
    }).catch(err => console.log(err));
  }
}

module.exports = User;
