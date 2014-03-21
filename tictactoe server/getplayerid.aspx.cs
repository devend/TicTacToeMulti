using System;
using System.Collections.Generic;
using System.Web;
using System.Web.Script.Serialization;
using System.Text;
using System.Data;
using MySql.Data.MySqlClient;

public partial class tictactoe_getplayerid : System.Web.UI.Page
{
    private class ResponseData
    {
        public int id { get; set; }
    }

    protected void Page_Load(object sender, EventArgs e)
    {
        ResponseData data = new ResponseData();
        data.id = GetPlayerId();

        JavaScriptSerializer js = new JavaScriptSerializer();
        Response.Write(js.Serialize(data));
    }

    private int GetPlayerId()
    {
        int id = 0;
        String conString = (string)Application["conTicTacToe"];

        MySqlConnection con = new MySqlConnection(conString);
        MySqlCommand cmd = new MySqlCommand();
        cmd.Connection = con;
        cmd.Parameters.Add("?name", MySqlDbType.VarChar, 45).Value = "name";  // prepared for real player name usage
        cmd.CommandText = "INSERT INTO player (id, name) VALUES (0, ?name)";

        try
        {
            con.Open();
            cmd.ExecuteNonQuery();

            cmd.CommandText = "SELECT LAST_INSERT_ID()";
            id = Convert.ToInt32(cmd.ExecuteScalar());
        }
        catch (MySqlException)
        {
            id = -1;
        }
        finally
        {
            con.Close();
        }

        return id;
    }
}