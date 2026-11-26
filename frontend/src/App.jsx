import { lazy } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'

const Home = lazy(() => import('./pages/Home.jsx'))
const Users = lazy(() => import('./pages/Users.jsx'))
const UserDetail = lazy(() => import('./pages/UserDetail.jsx'))
const Login = lazy(() => import('./pages/Login.jsx'))
const Profile = lazy(() => import('./pages/Profile.jsx'))
const NotFound = lazy(() => import('./pages/NotFound.jsx'))

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'users', element: <Users /> },
      { path: 'users/:id', element: <UserDetail /> },
      { path: 'login', element: <Login /> },
      {
        path: 'profile',
        element: (
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        ),
      },
      { path: '*', element: <NotFound /> },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
