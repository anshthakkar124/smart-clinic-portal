import React, { useEffect, useState } from 'react';
import { FileText, Download } from 'lucide-react';
import { prescriptionsAPI } from '../services/api';
import toast from 'react-hot-toast';

const Prescriptions = () => {
  const [loading, setLoading] = useState(true);
  const [prescriptions, setPrescriptions] = useState([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await prescriptionsAPI.getAll({});
        const list = Array.isArray(res.data) ? res.data : (res.data?.prescriptions || []);
        setPrescriptions(list);
      } catch (e) {
        toast.error('Failed to load prescriptions');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const downloadPdf = async (id) => {
    try {
      const res = await prescriptionsAPI.downloadPDF(id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `prescription-${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (e) {
      toast.error('Failed to download PDF');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3">
          <FileText className="h-8 w-8 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900">Prescriptions</h1>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
          </div>
        ) : prescriptions.length === 0 ? (
          <p className="text-gray-600">No prescriptions found.</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {prescriptions.map((p) => (
              <li key={p._id} className="py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{p.diagnosis || 'Prescription'}</p>
                  <p className="text-xs text-gray-600">Issued {new Date(p.issueDate).toLocaleDateString()} • Doctor: {p.doctor?.name || '-'}</p>
                </div>
                <button onClick={() => downloadPdf(p._id)} className="btn-secondary flex items-center">
                  <Download className="h-4 w-4 mr-2"/> Download PDF
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Prescriptions;
