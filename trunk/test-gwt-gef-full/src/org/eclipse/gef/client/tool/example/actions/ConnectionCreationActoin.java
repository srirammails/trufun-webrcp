package org.eclipse.gef.client.tool.example.actions;

import org.eclipse.gef.EditDomain;
import org.eclipse.gef.Tool;
import org.eclipse.gef.client.tool.example.model.MyConnectionModel;
import org.eclipse.gef.requests.SimpleFactory;
import org.eclipse.gef.tools.ConnectionCreationTool;
import org.eclipse.jface.resource.ImageDescriptor;

public class ConnectionCreationActoin extends AbstractGEFToolAction {

	public ConnectionCreationActoin(String text, EditDomain domain) {
		super(text, domain);
		setImageDescriptor(ImageDescriptor.createFromFile(
				CreationToolAction.class, "newConnection.gif"));
	}

	/*
	 * (�� Javadoc)
	 * 
	 * @see tool.example.actions.AbstractGEFToolAction#createTool()
	 */
	protected Tool createTool() {
		ConnectionCreationTool tool = new ConnectionCreationTool() {
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
			 * @see
			 * org.eclipse.gef.tools.AbstractConnectionCreationTool#deactivate()
			 */
			public void deactivate() {
				setChecked(false);
				super.deactivate();
			}

		};
		// �R�l�N�V������1�{����ƃc�[�����I������
		tool.setUnloadWhenFinished(true);
		tool.setFactory(new SimpleFactory(MyConnectionModel.class));
		return tool;
	}

}
