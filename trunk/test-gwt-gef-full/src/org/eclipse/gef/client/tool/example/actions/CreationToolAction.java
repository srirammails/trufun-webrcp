package org.eclipse.gef.client.tool.example.actions;

import org.eclipse.gef.EditDomain;
import org.eclipse.gef.Tool;
import org.eclipse.gef.client.tool.example.model.OrangeModel;
import org.eclipse.gef.requests.SimpleFactory;
import org.eclipse.gef.tools.CreationTool;
import org.eclipse.jface.resource.ImageDescriptor;

public class CreationToolAction extends AbstractGEFToolAction {

	public CreationToolAction(String text, EditDomain domain) {
		super(text, domain);
		setImageDescriptor(ImageDescriptor.createFromFile(
				CreationToolAction.class, "newModel.gif"));
	}

	/*
	 * (�� Javadoc)
	 * 
	 * @see tool.example.actions.AbstractGEFToolAction#createTool()
	 */
	protected Tool createTool() {
		CreationTool tool = new CreationTool() {

			/*
			 * (�� Javadoc)
			 * 
			 * @see org.eclipse.gef.tools.AbstractTool#activate()
			 */
			public void activate() {
				setChecked(true);
				super.activate();
			}

			/*
			 * (�� Javadoc)
			 * 
			 * @see org.eclipse.gef.tools.TargetingTool#deactivate()
			 */
			public void deactivate() {
				setChecked(false);
				super.deactivate();
			}

		};
		tool.setFactory(new SimpleFactory(OrangeModel.class));
		return tool;
	}

}
