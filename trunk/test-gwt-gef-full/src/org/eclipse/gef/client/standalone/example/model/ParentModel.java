package org.eclipse.gef.client.standalone.example.model;

import java.util.ArrayList;
import java.util.List;

public class ParentModel {
	private List children = new ArrayList();

	public void addChild(Object o) {
		children.add(o);
	}

	public List getChildren() {
		return children;
	}

}
