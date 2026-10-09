import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import DashboardPage from "@/pages/DashboardPage";
import DriverDetailPage from "@/pages/DriverDetailPage";
import DriversPage from "@/pages/DriversPage";
import NotFoundPage from "@/pages/NotFoundPage";
import NotificationsPage from "@/pages/NotificationsPage";
import ShipmentDetailPage from "@/pages/ShipmentDetailPage";
import ShipmentsPage from "@/pages/ShipmentsPage";
import TrackingPage from "@/pages/TrackingPage";
import VehicleDetailPage from "@/pages/VehicleDetailPage";
import VehiclesPage from "@/pages/VehiclesPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="tracking" element={<TrackingPage />} />
          <Route path="shipments" element={<ShipmentsPage />} />
          <Route path="shipments/:id" element={<ShipmentDetailPage />} />
          <Route path="vehicles" element={<VehiclesPage />} />
          <Route path="vehicles/:id" element={<VehicleDetailPage />} />
          <Route path="drivers" element={<DriversPage />} />
          <Route path="drivers/:id" element={<DriverDetailPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}