'use client';

import { useEffect, useState } from 'react';
import { fetchTaxTasks } from '@/features/tax-calculator/services/taxApi';

type Task = {
  id: string;
  status: string;
  createdAt: string;
};

export default function TaxTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(false);

  const loadTasks = async (pageNum: number) => {
    setLoading(true);
    try {
      const res = await fetchTaxTasks(pageNum, limit);

      setTasks(res.tasks); // 👈 IMPORTANT FIX
    } catch (err) {
      console.error(err);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
  let ignore = false;

  const load = async () => {
    const res = await fetchTaxTasks(page, limit);

    if (!ignore) {
      setTasks(res.tasks);
    }
  };

  load();

  return () => {
    ignore = true;
  };
}, [page, limit]);

  return (
    <div style={{ padding: 20 }}>
      <h1>Tax Tasks</h1>

      {loading && <p>Loading...</p>}

      {/* TABLE */}
      <table border={1} cellPadding={10} style={{ marginTop: 20, width: '100%' }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Status</th>
            <th>Created At</th>
          </tr>
        </thead>

        <tbody>
          {tasks.map((task) => (
            <tr key={task.id}>
              <td>{task.id}</td>
              <td>{task.status}</td>
              <td>{new Date(task.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* PAGINATION */}
      <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
        <button
          disabled={page === 1}
          onClick={() => setPage((p) => p - 1)}
        >
          Prev
        </button>

        <span>Page: {page}</span>

        <button
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}