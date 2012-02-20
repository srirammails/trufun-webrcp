package org.eclipse.gef.client.standalone.example.editparts;

import java.beans.PropertyChangeEvent;
import java.beans.PropertyChangeListener;

import org.eclipse.draw2d.ColorConstants;
import org.eclipse.draw2d.IFigure;
import org.eclipse.draw2d.Label;
import org.eclipse.draw2d.geometry.Rectangle;
import org.eclipse.gef.EditPolicy;
import org.eclipse.gef.GraphicalEditPart;
import org.eclipse.gef.client.standalone.example.model.ChildModel;
import org.eclipse.gef.editparts.AbstractGraphicalEditPart;

public class ChildEditPart extends AbstractGraphicalEditPart implements
		PropertyChangeListener {

	protected IFigure createFigure() {
		IFigure figure = new Label("Model");
		figure.setBackgroundColor(ColorConstants.orange);
		figure.setOpaque(true);
		return figure;
	}

	protected void createEditPolicies() {
		installEditPolicy(EditPolicy.COMPONENT_ROLE,
				new MyNonResizableEditPolicy());
	}

	public void propertyChange(PropertyChangeEvent evt) {
		if (evt.getPropertyName().equals(ChildModel.P_CONSTRAINT)) {
			refreshVisuals();
		}
	}

	public void activate() {
		((ChildModel) getModel()).addPropertyChangeListener(this);
		super.activate();
	}

	public void deactivate() {
		((ChildModel) getModel()).removePropertyChangeListener(this);
		super.deactivate();
	}

	protected void refreshVisuals() {
		Rectangle constraint = ((ChildModel) getModel()).getConstraint();

		((GraphicalEditPart) getParent()).setLayoutConstraint(this,
				getFigure(), constraint);
	}

}
