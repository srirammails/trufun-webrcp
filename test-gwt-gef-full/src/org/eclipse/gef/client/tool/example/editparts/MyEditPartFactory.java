package org.eclipse.gef.client.tool.example.editparts;

import org.eclipse.gef.EditPart;
import org.eclipse.gef.EditPartFactory;
import org.eclipse.gef.client.tool.example.model.*;

public class MyEditPartFactory implements EditPartFactory {

	/*
	 * (�� Javadoc)
	 * 
	 * @see
	 * org.eclipse.gef.EditPartFactory#createEditPart(org.eclipse.gef.EditPart,
	 * java.lang.Object)
	 */
	public EditPart createEditPart(EditPart context, Object model) {
		EditPart part = null;

		if (model instanceof CanvasModel)
			part = new CanvasEditPart();
		else if (model instanceof OrangeModel)
			part = new OrangeEditPart();
		else if (model instanceof MyConnectionModel)
			part = new MyConnectionEditPart();
		part.setModel(model);
		return part;
	}

}
