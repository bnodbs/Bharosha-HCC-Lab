export default function DashboardPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Welcome to Bharosha Lab</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="font-semibold text-lg text-gray-700">Recent Patients</h3>
          <p className="text-gray-500 mt-2">No data yet.</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="font-semibold text-lg text-gray-700">Pending Orders</h3>
          <p className="text-gray-500 mt-2">No data yet.</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="font-semibold text-lg text-gray-700">System Status</h3>
          <p className="text-green-600 mt-2">Online</p>
        </div>
      </div>
    </div>
  );
}
