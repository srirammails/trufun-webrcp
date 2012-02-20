package org.eclipse.gef.client.standalone.example.editparts;

import org.eclipse.gef.EditPart;
import org.eclipse.gef.EditPartFactory;
import org.eclipse.gef.client.standalone.example.model.ChildModel;
import org.eclipse.gef.client.standalone.example.model.ParentModel;

public class MyEditPartFactory implements EditPartFactory {

	public EditPart createEditPart(EditPart context, Object model) {
		EditPart part = null;
		if (model instanceof ParentModel)
			part = new ParentEditPart();
		else if (model instanceof ChildModel)
			part = new ChildEditPart();
		part.setModel(model);
		return part;
	}

}
