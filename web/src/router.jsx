
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
import { Completed } from '@/views/Auctions/Auction/Completed/Completed' 
import { Active } from '@/views/Auctions/Active/Active'
import { Archived } from '@/views/Auctions/Archived/Archived'
import { Create } from '@/views/Auctions/Create/Create'

export const Router = () => {
  return (
  <BrowserRouter>
    <NavBar />
    <Routes>
      <Route path="/" element={<Home />}/>
      <Route path="/auctions" element={<Auctions />}>
        <Route path="active" element={<Active />}/>
        <Route path="archived" element={<Archived />}/>
        <Route path=":roomKey" element={<Auction />}>
        </Route>
        <Route path="create" element={<Create />}/>
      </Route>
      <Route path="docs" element={<Docs />}>
      </Route>
    </Routes>
    <Footer />
  </BrowserRouter>
  )
}
