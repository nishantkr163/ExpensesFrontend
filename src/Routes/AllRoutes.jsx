import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { ExpensesTable } from '../Components/ExpensesTable'

const AllRoutes = () => {
  return (
    <Routes>
        <Route path='/' element={<ExpensesTable />} />
    </Routes>
  )
}

export default AllRoutes