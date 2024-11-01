const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Listing = require("./models/listing.js");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError = require("./utils/ExpressError.js");

//const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";
const MONGO_URL = "mongodb+srv://pacificnano:sahil100@cluster1.gddgs.mongodb.net/wanderlust?retryWrites=true&w=majority";


main()
  .then(() => {
    console.log("connected to DB");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(MONGO_URL);
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine('ejs', ejsMate);
app.use(express.static(path.join(__dirname, "/public")));

// Middleware for logging requests (for debugging)
app.use((req, res, next) => {
  console.log(`Incoming request to: ${req.path}`);
  next();
});

// Root route
app.get("/", (req, res) => {
  res.redirect("/listings"); // This will return a simple text response
});

// Index routing for listings
app.get("/listings", wrapAsync(async (req, res) => {
  const allListings = await Listing.find({});
  res.render("listings/index.ejs", { allListings });
}));

app.get("/listings/new", (req, res) => {
  res.render("listings/new.ejs");
});

app.get("/listings/:id/edit", wrapAsync(async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  res.render("listings/edit.ejs", { listing });
}));

// Update route
app.put("/listings/:id", wrapAsync(async (req, res) => {
  let { id } = req.params;
  await Listing.findByIdAndUpdate(id, { ...req.body.listing });
  res.redirect(`/listings/${id}`);
}));

// Delete listing
app.delete("/listings/:id", wrapAsync(async (req, res) => {
  let { id } = req.params;
  await Listing.findByIdAndDelete(id);
  res.redirect("/listings");
}));

// Show route for a specific listing
app.get("/listings/:id", wrapAsync(async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  res.render("listings/show.ejs", { listing });
}));

// Create new listing
app.post("/listings", wrapAsync(async (req, res) => {
  const newListing = new Listing(req.body.listing);
  await newListing.save();
  res.redirect("/listings");
}));

// 404 error handler for all undefined routes
app.all("*", (req, res, next) => {
  next(new ExpressError(404, "page not found!"));
});

// Error handling middleware
app.use((err, req, res, next) => {
  let { statusCode = 500, message = "some error" } = err;
  res.status(statusCode); // Set status before rendering the error page
  res.render("error.ejs", { err });
});

// Start server
app.listen(4000, () => {
  console.log("server is listening");
});
