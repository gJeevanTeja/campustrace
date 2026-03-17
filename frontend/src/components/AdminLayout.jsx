import React from 'react';

const AdminLayout = ({ children, darkMode }) => {

    return (
        <div style={{ width: '100%' }}>
            {children}
        </div>
    );
};

export default AdminLayout;
