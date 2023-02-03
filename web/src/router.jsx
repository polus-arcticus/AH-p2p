
import {
  createBrowserRouter,
  RouterProvider,
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";
import { NavBar } from '@/components/NavBar'
import { Footer } from '@/components/Footer'
import { Home } from '@/views/Home/Home'
import { Docs } from '@/views/Docs/Docs'
import { Auctions } from '@/views/Auctions/Auctions'
import { Auction } from '@/views/Auctions/Auction/Auction'
import { Active } from '@/views/Auctions/Active/Active'
import { Create } from '@/views/Auctions/Create/Create'

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
    errorElement: <div>error</div>,
  },
  {
    path: "/docs",
    element: <Docs />,
    errorElement: <div>error</div>,
  },
  {
    path: "/auctions",
    element: <Auction />,
    errorElement: <div>error</div>,
    children: [
      {
        path: "create",
        element: <Create />
      },
      {
        path: "active",
        element: <Active />
      },

    ]
  },

]);

export const Router = () => {
  return (
  <BrowserRouter>
    <NavBar />
    <Routes>
      <Route path="/" element={<Home />}/>
      <Route path="/auctions" element={<Auctions />}>
        <Route path=":roomKey" element={<Auction />}/>
        <Route path="create" element={<Create />}/>
        <Route path="active" element={<Active />}/>
      </Route>
      <Route path="docs" element={<Docs />}>
      </Route>
    </Routes>
    <Footer />
  </BrowserRouter>
  )
}
