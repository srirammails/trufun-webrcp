package org.eclipse.gef.client.tool.example.editparts;

import java.beans.PropertyChangeEvent;
import java.util.List;

import org.eclipse.draw2d.IFigure;
import org.eclipse.draw2d.LayeredPane;
import org.eclipse.draw2d.XYLayout;
import org.eclipse.gef.EditPolicy;
import org.eclipse.gef.client.tool.example.editpolicies.MyXYLayoutEditPolicy;
import org.eclipse.gef.client.tool.example.model.CanvasModel;

public class CanvasEditPart extends EditPartWithListener {

	/*
	 * (�� Javadoc)
	 * 
	 * @see org.eclipse.gef.editparts.AbstractGraphicalEditPart#createFigure()
	 */
	protected IFigure createFigure() {
		IFigure figure = new LayeredPane();
		figure.setLayoutManager(new XYLayout());
		return figure;
	}

	/*
	 * (�� Javadoc)
	 * 
	 * @see org.eclipse.gef.editparts.AbstractEditPart#createEditPolicies()
	 */
	protected void createEditPolicies() {
		installEditPolicy(EditPolicy.LAYOUT_ROLE, new MyXYLayoutEditPolicy());
	}

	/*
	 * (�� Javadoc)
	 * 
	 * @see java.beans.PropertyChangeListener#propertyChange(java.beans.
	 * PropertyChangeEvent)
	 */
	public void propertyChange(PropertyChangeEvent evt) {
		if (evt.getPropertyName().equals(CanvasModel.P_CHILDREN))
			refreshChildren();
	}

	private CanvasModel getCanvasModel() {
		return (CanvasModel) getModel();
	}

	/*
	 * (�� Javadoc)
	 * 
	 * @see org.eclipse.gef.editparts.AbstractEditPart#getModelChildren()
	 */
	protected List getModelChildren() {
		return getCanvasModel().getChildren();
	}
}
