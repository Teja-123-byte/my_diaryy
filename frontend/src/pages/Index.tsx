import { Navigate } from "react-router-dom";

// Show login as the entry point (cozy first impression)
const Index = () => <Navigate to="/login" replace />;

export default Index;
