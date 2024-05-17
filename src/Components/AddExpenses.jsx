import React, { useState } from "react";
import axios from "axios";
import { Box, TextField } from "@mui/material";
import { DemoContainer } from "@mui/x-date-pickers/internals/demo";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import AddBoxOutlinedIcon from "@mui/icons-material/AddBoxOutlined";
import dayjs from "dayjs";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const AddExpenses = ({ change, setChange, handleClose }) => {
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");
  const [amount, setAmount] = useState();
  const [loader, setLoader] = useState(false);

  const addExpensesFunc = async () => {
    setLoader(true);
    try {
      const formattedDate = dayjs(date).format("DD MMMM YYYY (ddd)");

      const newExpense = {
        spentOn: formattedDate,
        amount: parseFloat(amount),
        reason: reason,
      };

      if (
        newExpense.amount == null ||
        newExpense.amount == undefined ||
        newExpense.amount == 0 ||
        newExpense.reason == null ||
        newExpense.reason == undefined ||
        newExpense.reason.length == 0 ||
        newExpense.spentOn == null ||
        newExpense.spentOn == undefined ||
        newExpense.spentOn.length == 0
      ) {
        toast.error("Please fill all fields");
        setLoader(false);

        return;
      }

      // Make API call to add the new expense
      const response = await axios.post(
        `${process.env.REACT_APP_BASE_URL}/add`,
        newExpense
      );
      toast.success("Data Added");
      setReason("");
      setAmount("");
      handleClose();
      setDate(new Date());
      setChange(!change);
      setLoader(false);
    } catch (error) {
      console.error("Error adding expense:", error);
    }
  };

  return (
    <div
      style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
    >
      <ToastContainer />
      <Box
        sx={{
          margin: "auto",
        }}
      >
        <h3 pb={"10px"} size="md">
          Add Reason
        </h3>
        <TextField
          sx={{ width: "100%" }}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          id="outlined-basic"
          label="Enter reason"
          variant="outlined"
        />
      </Box>
      <Box
        sx={{
          margin: "auto",
        }}
      >
        <h3 pb={"10px"} size="md">
          Enter Amount
        </h3>
        <TextField
          sx={{ width: "100%" }}
          value={amount}
          type="number"
          onChange={(e) => setAmount(e.target.value)}
          id="outlined-basic"
          label="Enter amount"
          variant="outlined"
        />
      </Box>
      <Box
        sx={{
          margin: "auto",
        }}
      >
        <h3 pb={"10px"} size="md">
          Select Date
        </h3>
        <Box pb={"10px"}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DemoContainer components={["DatePicker"]}>
              <DatePicker
                value={dayjs(date)}
                onChange={(newDate) => {
                  setDate(newDate.toDate());
                }}
                label="Basic date picker"
              />
            </DemoContainer>
          </LocalizationProvider>
        </Box>
      </Box>
      <AddBoxOutlinedIcon onClick={addExpensesFunc} sx={{ fontSize: 40 }} />
    </div>
  );
};

export default AddExpenses;
