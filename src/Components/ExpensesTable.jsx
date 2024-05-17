import React, { useEffect, useState } from "react";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Button from "@mui/material/Button";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import axios from "axios";
import dayjs from "dayjs";
import AddExpenses from "./AddExpenses";
import Modal from "@mui/material/Modal";
import DeleteForeverOutlinedIcon from "@mui/icons-material/DeleteForeverOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import CloudDoneOutlinedIcon from "@mui/icons-material/CloudDoneOutlined";
import { Box, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from "@mui/material";
import Loader from "./Loader";
import { ToastContainer, toast } from "react-toastify";

export const ExpensesTable = () => {
  const [expenses, setExpenses] = useState([]);
  const [editingExpense, setEditingExpense] = useState({});
  const [editingIndex, setEditingIndex] = useState(null);
  const [currentAccordionIndex, setCurrentAccordionIndex] = useState(-1);
  const [change, setChange] = useState(true);
  const [open, setOpen] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [date, setDate] = useState("");
  const [loader, setLoader] = useState(false);

  const style = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 400,
    bgcolor: "background.paper",
    border: "2px solid #000",
    boxShadow: 24,
    p: 4,
  };

  useEffect(() => {
    fetchData();
  }, [change]);

  const fetchData = async () => {
    setLoader(true);
    try {
      const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/get`);
      const expenses = response.data.expenses;
      const groupedExpenses = groupExpensesByMonthYear(expenses);
      setExpenses(groupedExpenses);
      const currentDate = new Date();
      const currentMonthYear = `${currentDate.toLocaleString("en-us", {
        month: "long",
      })} ${currentDate.getFullYear()}`;
      const currentIndex = Object.keys(groupedExpenses).indexOf(currentMonthYear);
      setCurrentAccordionIndex(currentIndex);
      setLoader(false);
    } catch (error) {
      toast.error("Error fetching expenses:", error);
    }
  };

  const groupExpensesByMonthYear = (expenses) => {
    const groupedExpenses = {};
    expenses.forEach((expense) => {
      const dateParts = expense.spentOn.split(" ");
      const monthYear = `${dateParts[1]} ${dateParts[2]}`;
      if (!groupedExpenses[monthYear]) {
        groupedExpenses[monthYear] = { expenses: [], total: 0 };
      }
      groupedExpenses[monthYear].expenses.push(expense);
      groupedExpenses[monthYear].total += expense.amount;
    });
    const sortedKeys = Object.keys(groupedExpenses).sort((a, b) => {
      const [monthA, yearA] = a.split(" ");
      const [monthB, yearB] = b.split(" ");
      const dateA = new Date(`${monthA} 1, ${yearA}`);
      const dateB = new Date(`${monthB} 1, ${yearB}`);
      return dateB - dateA;
    });
    const sortedGroupedExpenses = {};
    sortedKeys.forEach((key) => {
      sortedGroupedExpenses[key] = groupedExpenses[key];
    });
    return sortedGroupedExpenses;
  };

  const editCell = (index, expense) => {
    setEditingExpense(expense);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditingExpense((prevExpense) => ({
      ...prevExpense,
      [name]: value,
    }));
  };

  const handleEditExpense = async () => {
    setLoader(true);
    const formattedDate = dayjs(date || editingExpense.spentOn, "DD MMM YYYY (ddd)").format("DD MMMM YYYY (ddd)");
    const updatedExpense = {
      ...editingExpense,
      spentOn: formattedDate,
    };
    try {
      await axios.patch(
        `${process.env.REACT_APP_BASE_URL}/${editingExpense._id}/edit`,
        updatedExpense
      );
      toast.success("Edited");
      fetchData();
    } catch (error) {
      toast.error("Error updating expense:", error);
    }
    setEditingIndex(null);
    handleCloseEditModal();
    setEditingExpense({});
  };

  const handleDateChange = (newDate) => {
    setEditingExpense((prevExpense) => ({
      ...prevExpense,
      spentOn: newDate.format("DD MMM YYYY (ddd)"),
    }));
  };

  const deleteExpense = async (expenseId) => {
    setLoader(true);
    try {
      await axios.delete(
        `${process.env.REACT_APP_BASE_URL}/${expenseId}/delete`
      );
      fetchData();
      toast.success("Deleted");
    } catch (error) {
      toast.error("Error deleting expense:", error);
    }
  };

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const handleOpenEditModal = () => setOpenEdit(true);
  const handleCloseEditModal = () => setOpenEdit(false);

  return (
    <div style={{ padding: "20px" }}>
      <ToastContainer />
      {loader && <Loader />}
      <Modal
        open={openEdit}
        onClose={handleCloseEditModal}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Typography id="modal-modal-title" variant="h6" component="h2">
            Edit Details
          </Typography>
          <Typography id="modal-modal-description" sx={{ mt: 2 }}>
            <Box sx={{ margin: "auto" }}>
              <h3 pb={"10px"} size="md">Edit Reason</h3>
              <TextField
                sx={{ width: "100%" }}
                value={editingExpense.reason}
                name="reason"
                onChange={handleInputChange}
                id="outlined-basic"
                label="Enter reason"
                variant="outlined"
              />
            </Box>
            <Box sx={{ margin: "auto" }}>
              <h3 pb={"10px"} size="md">Edit Amount</h3>
              <TextField
                sx={{ width: "100%" }}
                value={editingExpense.amount}
                type="number"
                name="amount"
                onChange={handleInputChange}
                id="outlined-basic"
                label="Enter amount"
                variant="outlined"
              />
            </Box>
            <Box sx={{ margin: "auto" }}>
              <h3 pb={"10px"} size="md">Edit Date</h3>
              <Box pb={"10px"}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    value={dayjs(editingExpense.spentOn, "DD MMM YYYY (ddd)")}
                    onChange={handleDateChange}
                    label="Basic date picker"
                  />
                </LocalizationProvider>
              </Box>
            </Box>
            <Box sx={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CloudDoneOutlinedIcon
                sx={{ fontSize: 40 }}
                onClick={handleEditExpense}
              />
            </Box>
          </Typography>
        </Box>
      </Modal>
      <h1>My Expenses</h1>
      <Button onClick={handleOpen}>Add expense</Button>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Typography id="modal-modal-description" sx={{ mt: 2 }}>
            <AddExpenses handleClose={handleClose} change={change} setChange={setChange} />
          </Typography>
        </Box>
      </Modal>
      {Object.entries(expenses).map(([monthYear, { expenses, total }]) => (
        <Accordion key={monthYear}>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel1-content"
            id="panel1-header"
          >
            <Typography>
              {monthYear} - Total: Rs.{total.toFixed(2)}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Table variant="striped" colorScheme="teal" size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: "100px" }}>Spent On</TableCell>
                  <TableCell sx={{ width: "150px" }}>Reason</TableCell>
                  <TableCell sx={{ width: "100px" }}>Amount</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {expenses.map((expense, index) => (
                  <TableRow key={expense._id}>
                    <TableCell>{expense.spentOn}</TableCell>
                    <TableCell>
                      <div className="ellipsis-text" style={{ width: "100px" }}>
                        {expense.reason}
                      </div>
                    </TableCell>
                    <TableCell>Rs.{expense.amount}</TableCell>
                    <TableCell>
                      <DeleteForeverOutlinedIcon
                        onClick={() => deleteExpense(expense._id)}
                        color="error"
                      />
                      <EditOutlinedIcon
                        onClick={() => {
                          editCell(index, expense);
                          handleOpenEditModal();
                        }}
                        color="success"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </AccordionDetails>
        </Accordion>
      ))}
    </div>
  );
};

export default ExpensesTable;
