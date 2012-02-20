package org.eclipse.gef.client.standalone.example.editparts;

import java.util.List;

import org.eclipse.draw2d.IFigure;
import org.eclipse.draw2d.LayeredPane;
import org.eclipse.draw2d.XYLayout;
import org.eclipse.gef.client.standalone.example.model.ParentModel;
import org.eclipse.gef.editparts.AbstractGraphicalEditPart;

public class ParentEditPart extends AbstractGraphicalEditPart {

	protected IFigure createFigure() {
		IFigure figure = new LayeredPane();

		figure.setLayoutManager(new XYLayout());
		return figure;
	}

	protected void createEditPolicies() {

	}

	protected List getModelChildren() {
		return ((ParentModel) getModel()).getChildren();
	}

}
