import React from 'react';
import { Button, Badge, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { X, Plus } from 'lucide-react';

const SalesTabs = ({ tabs, activeTabId, onTabChange, onTabClose, onNewTab }) => {
  const calculateTotal = (cart) => {
    return cart.reduce((sum, item) => {
      const quantity = parseFloat(item.quantity);
      const price = parseFloat(item.price_sell);
      return sum + (quantity * price);
    }, 0);
  };

  return (
    <div className="sales-tabs-container mb-3" style={{ 
      display: 'flex', 
      gap: '8px', 
      overflowX: 'auto',
      borderBottom: '2px solid #dee2e6',
      paddingBottom: '8px'
    }}>
      {tabs.map((tab, index) => {
        const isActive = tab.id === activeTabId;
        const itemCount = tab.cart?.length || 0;
        const total = calculateTotal(tab.cart || []);
        
        return (
          <div
            key={tab.id}
            className={`sale-tab ${isActive ? 'active' : ''}`}
            onClick={() => onTabChange(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              borderRadius: '8px 8px 0 0',
              cursor: 'pointer',
              backgroundColor: isActive ? '#fff' : '#f8f9fa',
              border: isActive ? '2px solid #0d6efd' : '2px solid transparent',
              borderBottom: isActive ? '2px solid #fff' : '2px solid #dee2e6',
              marginBottom: isActive ? '-2px' : '0',
              minWidth: '180px',
              transition: 'all 0.2s ease'
            }}
          >
            <div className="flex-grow-1">
              <div className="d-flex align-items-center gap-2">
                <strong style={{ fontSize: '0.9rem' }}>Venta #{index + 1}</strong>
                <Badge bg={isActive ? 'primary' : 'secondary'} pill>
                  {itemCount}
                </Badge>
              </div>
              {tab.customer && (
                <small className="text-muted d-block text-truncate" style={{ maxWidth: '120px' }}>
                  {tab.customer.name}
                </small>
              )}
              {total > 0 && (
                <small className="text-success fw-bold">
                  ${total.toFixed(2)}
                </small>
              )}
            </div>
            
            {tabs.length > 1 && (
              <OverlayTrigger
                placement="top"
                overlay={<Tooltip>Cerrar venta</Tooltip>}
              >
                <Button
                  variant="link"
                  size="sm"
                  className="p-0 text-danger"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTabClose(tab.id);
                  }}
                  style={{ minWidth: 'auto' }}
                >
                  <X size={16} />
                </Button>
              </OverlayTrigger>
            )}
          </div>
        );
      })}
      
      {tabs.length < 5 && (
        <OverlayTrigger
          placement="top"
          overlay={<Tooltip>Nueva venta (Ctrl+T)</Tooltip>}
        >
          <Button
            variant="outline-primary"
            size="sm"
            onClick={onNewTab}
            className="d-flex align-items-center gap-1"
            style={{
              borderRadius: '8px 8px 0 0',
              padding: '8px 16px'
            }}
          >
            <Plus size={16} />
            Nueva
          </Button>
        </OverlayTrigger>
      )}
    </div>
  );
};

export default SalesTabs;
