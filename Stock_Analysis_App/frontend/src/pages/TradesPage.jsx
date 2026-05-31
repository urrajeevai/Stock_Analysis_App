import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTrades } from '../hooks/useTrades.js'
import { useAuth } from '../context/AuthContext.jsx'
import TradeTable from '../components/trades/TradeTable.jsx'

const PAGE_SIZE = 20

export default function TradesPage() {
  const { isAdmin, isTrader } = useAuth()
  const navigate = useNavigate()
  const [page, setPage] = useState(0)
  const [filters, setFilters] = useState({})
  const [sort, setSort] = useState('createdAt')
  const [sortDir, setSortDir] = useState('desc')

  const { trades, loading, error, pagination } = useTrades({
    ...filters, page, size: PAGE_SIZE, sort, sortDir,
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
    setSort('createdAt')
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

      <TradeTable
        trades={trades}
        loading={loading}
        onRowClick={(id) => navigate(`/trades/${id}`)}
        canCreate={isAdmin || isTrader}
        onNewTrade={() => navigate('/trades/new')}
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
