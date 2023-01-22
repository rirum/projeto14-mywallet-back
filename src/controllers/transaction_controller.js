import db from "../database.js";

export async function get(req, res) {
  const userId = res.locals.userId;

  try {
    const transactions = await db
      .collection("transaction")
      .find({ user: userId })
      .toArray();

    let totalBalance = 0;

    transactions.forEach((element) => {
      let valor = Number(element.value);

      if (element.type === "entry") {
        totalBalance = totalBalance + valor;
      } else {
        totalBalance = totalBalance - valor;
      }
    });

    const result = {
      totalBalance: totalBalance,
      transactions: transactions.reverse(),
    };

    return res.status(200).send(result);
  } catch (error) {
    console.log(error);
    return res.sendStatus(500);
  }
}

export async function save(req, res) {
  const { description, value, type } = req.body;

  const userId = res.locals.userId;
  if (!userId) return res.sendStatus(500);

  try {
    const user = await db.collection("user").findOne({ _id: userId });

    let date = new Date(Date.now());

    let month = (date.getMonth() + 1).toString().padStart(2, "0");
    let day = (date.getDate() + 1).toString().padStart(2, "0");

    date = day + "/" + month;

    const transaction = {
      description: description,
      value: value,
      user: user._id,
      type: type,
      date: date,
    };

    await db.collection("transaction").insertOne(transaction);

    res.sendStatus(201);
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
}
