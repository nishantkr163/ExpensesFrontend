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
import AddIcon from "@mui/icons-material/Add";
import Modal from "@mui/material/Modal";
import DeleteForeverOutlinedIcon from "@mui/icons-material/DeleteForeverOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { PinInput } from "react-input-pin-code";
import Divider from '@mui/material/Divider';

import {
  Box,
  Checkbox,
  Fab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableSortLabel,
  TextField,
  Typography,
} from "@mui/material";
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
  const [openPin, setOpenPin] = useState(false);
  const [date, setDate] = useState("");
  const [loader, setLoader] = useState(false);
  const [sortConfig, setSortConfig] = useState({});
  const [values, setValues] = useState(["", "", "", ""]);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const handleOpenEditModal = () => setOpenEdit(true);
  const handleCloseEditModal = () => setOpenEdit(false);
  const handleOpenPinModal = () => setOpenPin(true);
  const handleClosePinModal = () => setOpenPin(false);
  const [error, setError] = useState(false);
  const [action, setAction] = useState("");

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
    display : 'flex',
    alignItems : 'center',
    justifyContent : 'center'
  };

  useEffect(() => {
    fetchData();
  }, [change]);

  const handleComplete = (values) => {
    console.log('PIN complete:', values.join(''));
    if(values.join('') != '0000') {
      setError(true)
      toast.error("Authentication failed! Wrong PIN");
    } else {
      handleClosePinModal();
      toast.success("Authentication Successfull!");
    }
  };

  const containerStyle = {
    border: '2px solid red',
    borderRadius: '5px',
  };

  const fetchData = async () => {
    setLoader(true);
    try {
      const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/get`);
      const expenses = response.data.expenses;
      const groupedExpenses = groupExpensesByMonthYear(expenses);
      console.log(groupedExpenses,"groupedExpenses")
      setExpenses(groupedExpenses);
      const currentDate = new Date();
      const currentMonthYear = `${currentDate.toLocaleString("en-us", {
        month: "long",
      })} ${currentDate.getFullYear()}`;
      const currentIndex =
        Object.keys(groupedExpenses).indexOf(currentMonthYear);
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
      expense['checked'] = true
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
    handleCloseEditModal();
    const formattedDate = dayjs(
      date || editingExpense.spentOn,
      "DD MMM YYYY (ddd)"
    ).format("DD MMMM YYYY (ddd)");
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

  const handleSort = (monthYear, column) => {
    const isAsc =
      sortConfig[monthYear]?.orderBy === column &&
      sortConfig[monthYear]?.order === "asc";
    setSortConfig({
      ...sortConfig,
      [monthYear]: { orderBy: column, order: isAsc ? "desc" : "asc" },
    });
  };

  const totalExpensesInMonth = (monthYear) => {
    const monthExpenses = expenses[monthYear];
  
    const total = monthExpenses.expenses
      .filter(expense => expense.checked)
      .reduce((acc, item) => acc + item.amount, 0);
  
    console.log(total);
    setExpenses((prevExpenses) => ({
      ...prevExpenses,
      [monthYear]: {
        ...prevExpenses[monthYear],
        total: total,
      },
    }));
    setLoader(false);
  }

  const handleCheckboxChange = (monthYear, expenseId) => {
    setLoader(true);
    const updatedExpenses = { ...expenses };
    const monthExpenses = updatedExpenses[monthYear].expenses;
    const expenseIndex = monthExpenses.findIndex(exp => exp._id === expenseId);
    if (expenseIndex !== -1) {
      monthExpenses[expenseIndex].checked = !monthExpenses[expenseIndex].checked;
      setExpenses(updatedExpenses);
    }
    totalExpensesInMonth(monthYear)
  };

  const sortExpenses = (expenses, monthYear) => {
    const { orderBy, order } = sortConfig[monthYear] || {};
    if (!orderBy) return expenses;

    return expenses.slice().sort((a, b) => {
      let aValue = a[orderBy];
      let bValue = b[orderBy];

      if (orderBy === "spentOn") {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      } else if (orderBy === "amount") {
        aValue = parseFloat(aValue);
        bValue = parseFloat(bValue);
      }

      if (aValue < bValue) {
        return order === "asc" ? -1 : 1;
      } else if (aValue > bValue) {
        return order === "asc" ? 1 : -1;
      }
      return 0;
    });
  };

  return (
    <div>
      <ToastContainer />
      {loader && <Loader />}
      {/* Editing modal */}
      <Modal
        open={openEdit}
        onClose={handleCloseEditModal}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Typography id="modal-modal-description" sx={{ mt: 2 }}>
            <Box sx={{ margin: "auto" }}>
              <h3 pb={"10px"} size="md">
                Edit Reason
              </h3>
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
            <Divider />
            <Box sx={{ margin: "auto" }}>
              <h3 pb={"10px"} size="md">
                Edit Amount
              </h3>
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
            <Divider />
            <Box sx={{ margin: "auto" }}>
              <h3 pb={"10px"} size="md">
                Edit Date
              </h3>
              <Box pb={"10px"}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    value={dayjs(editingExpense.spentOn, "DD MMM YYYY (ddd)")}
                    onChange={handleDateChange}
                    label="Edit Date"
                  />
                </LocalizationProvider>
              </Box>
            </Box>
            <Box
              sx={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Button onClick={handleEditExpense} variant="contained">
                Edit
              </Button>
            </Box>
          </Typography>
        </Box>
      </Modal>
      <h1>My Expenses</h1>

      <Fab
        style={{
          position: "fixed",
          bottom: "30px",
          right: "30px",
          zIndex: "99",
        }}
        size="large"
        onClick={handleOpen}
        color="primary"
        aria-label="add"
      >
        <AddIcon />
      </Fab>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Typography id="modal-modal-description" sx={{ mt: 2 }}>
            <AddExpenses
              handleClose={handleClose}
              change={change}
              setChange={setChange}
            />
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
                  <TableCell sx={{ width: "50px" }}>
                    <TableSortLabel
                      active={sortConfig[monthYear]?.orderBy === "spentOn"}
                      direction={sortConfig[monthYear]?.order || "asc"}
                      onClick={() => handleSort(monthYear, "spentOn")}
                    >
                      Spent On
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ width: "100px" }}>
                    <TableSortLabel
                      active={sortConfig[monthYear]?.orderBy === "reason"}
                      direction={sortConfig[monthYear]?.order || "asc"}
                      onClick={() => handleSort(monthYear, "reason")}
                    >
                      Reason
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ width: "100px" }}>
                    <TableSortLabel
                      active={sortConfig[monthYear]?.orderBy === "amount"}
                      direction={sortConfig[monthYear]?.order || "asc"}
                      onClick={() => handleSort(monthYear, "amount")}
                    >
                      Amount
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortExpenses(expenses, monthYear).map((expense, index) => (
                  <TableRow key={expense._id}>
                    <TableCell sx={{ padding : "0" }}>
                      <Box>
                      <Checkbox
                          checked={expense.checked}
                          onChange={() => handleCheckboxChange(monthYear, expense._id)}
                        />
                        {expense.spentOn}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <div style={{ width: "100px" }}>
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

      {/* Pin modal */}
      <Modal
        open={openPin}
        onClose={() => {
          handleClosePinModal()
          setValues(["", "", "", ""])
        }}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Typography id="modal-modal-description" sx={{ mt: 2 }}>
            <PinInput
              values={values}
              onComplete={handleComplete}
              autoFocus={true}
              mask={true}
              size={"lg"}
              validBorderColor={ error ? "rgb(230, 7, 7)" : "rgb(25,135,84)"}
              onChange={(value, index, values) => setValues(values)}
            />
          </Typography>
        </Box>
      </Modal>
    </div>
  );
};
