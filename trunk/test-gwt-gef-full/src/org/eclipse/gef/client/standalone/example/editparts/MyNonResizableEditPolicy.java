package org.eclipse.gef.client.standalone.example.editparts;

import java.util.List;

import org.eclipse.gef.EditPart;
import org.eclipse.gef.client.standalone.example.model.commands.LeftCommand;
import org.eclipse.gef.commands.Command;
import org.eclipse.gef.commands.CompoundCommand;
import org.eclipse.gef.editpolicies.NonResizableEditPolicy;
import org.eclipse.gef.requests.AlignmentRequest;

public class MyNonResizableEditPolicy extends NonResizableEditPolicy {

	protected Command getAlignCommand(AlignmentRequest request) {
		List editparts = request.getEditParts();
		CompoundCommand cmd = new CompoundCommand();

		for (int i = 0; i < editparts.size(); i++) {
			EditPart part = (EditPart) editparts.get(i);
			cmd.add(new LeftCommand(part.getModel()));
		}
		return cmd;
	}
}
