import { useState, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { ProductService } from "./AdvanceFilterPanel/ProductService";

interface Product {
	id: string;
	code: string;
	name: string;
	description: string;
	image: string;
	price: number;
	category: string;
	quantity: number;
	inventoryStatus: string;
	rating: number;
}

const Datatable: React.FC = () => {
	// ❌ FIXED: Incorrect `useState(Product[])` syntax
	const [products, setProducts] = useState<Product[]>([]);

	useEffect(() => {
		ProductService.getProductsMini().then((data: Product[]) => {
			setProducts(data);
		});
	}, []);

	return (
		<DataTable value={products} tableStyle={{ minWidth: "50rem" }}>
			<Column field="code" header="Code" />
			<Column field="name" header="Name" />
			<Column field="category" header="Category" />
			<Column field="quantity" header="Quantity" />
		</DataTable>
	);
};

export default Datatable;
