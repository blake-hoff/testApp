import './ConfirmDeleteDialog.css';

const ConfirmDeleteDialog = ({ onConfirm, onCancel }) => (
  <div className="delete-confirm-panel">
    <div className="delete-dialog">
      <p>Are you sure you want to delete this item?</p>
      <div className="dialog-actions">
        <button className="confirm-btn" onClick={onConfirm}>
          Yes, delete
        </button>
        <button className="cancel-btn" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  </div>
);

export default ConfirmDeleteDialog;
