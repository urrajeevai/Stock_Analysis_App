import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAnalysis } from '../hooks/useAnalysis.js'
import { useAuth } from '../context/AuthContext.jsx'
import AnalysisTable from '../components/analysis/AnalysisTable.jsx'

export default function AnalysisPage() {
  const { isAdmin, isTrader } = useAuth()
  const navigate = useNavigate()
  const [page, setPage] = useState(0)
  const [filters, setFilters] = useState({})
  const [sort, setSort] = useState('analysisDate')
  const [sortDir, setSortDir] = useState('desc')

  const { analyses, loading, error, pagination } = useAnalysis({
    ...filters, page, sort, sortDir,
  })

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters)
    setPage(0)
  }

  const handleSort = (key) => {
    if (sort === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSort(key)
      setSortDir('desc')
    }
    setPage(0)
  }

  const handleResetSort = () => {
    setSort('analysisDate')
    setSortDir('desc')
    setPage(0)
  }

  return (
    <div className="space-y-4 max-w-7xl animate-fade-in">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}
      <AnalysisTable
        analyses={analyses}
        loading={loading}
        onRowClick={(id) => navigate(`/analysis/${id}`)}
        canCreate={isAdmin || isTrader}
        onNewAnalysis={() => navigate('/analysis/new')}
        filters={filters}
        onFilterChange={handleFilterChange}
        pagination={pagination}
        onPageChange={setPage}
        sortKey={sort}
        sortDir={sortDir}
        onSort={handleSort}
        onResetSort={handleResetSort}
      />
    </div>
  )
}
